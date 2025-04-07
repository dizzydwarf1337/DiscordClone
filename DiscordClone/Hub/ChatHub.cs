using DiscordClone.Models.Dtos;
using Microsoft.AspNetCore.SignalR;

namespace DiscordClone.Hubs
{
    public class ChatHub : Hub
    {
        private readonly Dictionary<string, string> _userConnections = new Dictionary<string, string>();
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier; 
            if (userId != null)
            {
                _userConnections[userId] = Context.ConnectionId;
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.UserIdentifier;
            if (userId != null)
            {
                _userConnections.Remove(userId); 
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SetUserId(string userId)
        {
            var connectionId = Context.ConnectionId;

            if (!_userConnections.ContainsKey(userId))
            {
                _userConnections[userId] = connectionId;
                Console.WriteLine($"UserId {userId} associated with connectionId {connectionId}");
            }
            else
            {
                Console.WriteLine($"UserId {userId} already associated with connectionId {_userConnections[userId]}");
            }
        }

        public async Task JoinChannel(string groupName)
        {
            var connectionId = Context.ConnectionId;
            await Groups.AddToGroupAsync(connectionId, groupName);
            await Task.CompletedTask;
        }

        public async Task LeaveChannel(string groupName)
        {
            var connectionId = Context.ConnectionId;
            await Groups.RemoveFromGroupAsync(connectionId, groupName);
        }
        public async Task SendPrivateMessage(PrivateMessageDto privateMessageDto)
        {
            await Clients.User(privateMessageDto.SenderId.ToString())
                .SendAsync("ReceivePrivateMessage", privateMessageDto);
            if (_userConnections.TryGetValue(privateMessageDto.ReceiverId.ToString(), out var connectionId))
            {
                await Clients.User(privateMessageDto.ReceiverId.ToString())
                    .SendAsync("ReceivePrivateMessage", privateMessageDto);

            }
            else
            {
                Console.WriteLine("Receiver not connected");
            }
        }

        public async Task SendGroupMessage(GroupMessageDto groupMessageDto)
        {
            await Clients.Group($"{groupMessageDto.GroupId}").SendAsync("ReceiveGroupMessage", groupMessageDto);
        }
        public async Task SendMessage(MessageDto messageDto, string groupName)
        {
            await Clients.Group(groupName).SendAsync("ReceiveMessage", messageDto);
        }
    }
}
