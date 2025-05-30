using DiscordClone.Models.Dtos;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace DiscordClone.Hubs
{
    public class ChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (userId != null)
                _userConnections[userId] = Context.ConnectionId;

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.UserIdentifier;
            if (userId != null)
                _userConnections.TryRemove(userId, out _);

            await base.OnDisconnectedAsync(exception);
        }

        public async Task SetUserId(string userId)
        {
            var connectionId = Context.ConnectionId;
            _userConnections[userId] = connectionId;
        }

        public async Task JoinChannel(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveChannel(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task SendNotification(string userId, string type, object payload)
        {
            var notification = new NotificationDto
            {
                ReceiversId = new List<Guid> { Guid.Parse(userId) },
                Type = type,
                Payload = payload
            };

            if (_userConnections.TryGetValue(userId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveNotification", notification);
            }
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
