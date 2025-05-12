using DiscordClone.Models.Dtos;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace DiscordClone.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ConcurrentDictionary<string, string> _userConnections = new ConcurrentDictionary<string, string>();
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
                _userConnections.TryRemove(userId, out _); 
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
            else
            {
                Console.WriteLine("User not connected");
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
        public async Task CallUser(CallUserDto callUserDto)
        {
            if (_userConnections.TryGetValue(callUserDto.TargetId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveCall", callUserDto);
            }
            else
            {
                Console.WriteLine("Receiver not connected");
            }
        }

        public async Task AcceptCall(string callerId)
        {
            if (_userConnections.TryGetValue(callerId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("CallAccepted", Context.UserIdentifier);
            }
        }

        public async Task DeclineCall(string callerId)
        {
            if (_userConnections.TryGetValue(callerId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("CallDeclined", Context.UserIdentifier);
            }
        }
        public async Task EndCall(string targetId)
        {
            if (_userConnections.TryGetValue(targetId, out var connectionId))
            {
                Console.WriteLine($"Ending call for target: {targetId}");
                await Clients.Client(connectionId).SendAsync("CallEnded", Context.UserIdentifier);
            }
        }

        public async Task SendSDP(string targetId, string sdp)
        {
            if (_userConnections.TryGetValue(targetId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveSDP", sdp);
            }
        }

        public async Task SendIceCandidate(string targetId, string candidate)
        {
            if (_userConnections.TryGetValue(targetId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveIceCandidate", candidate);
            }
        }
    }
}
