using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace DiscordClone.Hubs
{
    public class VoiceHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, VoiceUserDto>> _channelUsers = new();
        private static readonly ConcurrentDictionary<string, string> _userCurrentChannel = new();

        private readonly UserManager<User> _userManager;

        public VoiceHub(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;

            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine($"VoiceHub: Connection attempt with no UserIdentifier. ConnectionId: {connectionId}");
                Context.Abort();
                return;
            }
            _userConnections[userId] = connectionId;
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;

            if (!string.IsNullOrEmpty(userId))
            {
                _userConnections.TryRemove(userId, out _);
                await LeaveVoiceChannelInternal(userId, connectionId, true, "disconnect");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public Task SetUserId(string userId)
        {
            var currentUserId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;
            if (string.IsNullOrEmpty(currentUserId) && !string.IsNullOrEmpty(userId))
            {
                _userConnections[userId] = connectionId;
            }
            else if (currentUserId != userId && !string.IsNullOrEmpty(userId))
            {
                _userConnections.TryRemove(currentUserId!, out _);
                _userConnections[userId] = connectionId;
            }
            else if (!string.IsNullOrEmpty(userId))
            {
                _userConnections[userId] = connectionId;
            }
            return Task.CompletedTask;
        }

        public async Task CallUser(CallUserDto callUserDto)
        {
            var callerId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(callerId) || callUserDto == null || string.IsNullOrEmpty(callUserDto.TargetId)) return;

            callUserDto.CallerId = callerId;

            if (_userConnections.TryGetValue(callUserDto.TargetId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceiveCall", callUserDto);
            }
            else
            {
                await Clients.Caller.SendAsync("CallUserFailed", callUserDto.TargetId, "User not connected.");
            }
        }

        public async Task AcceptCall(string callerId)
        {
            var acceptingUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(acceptingUserId) || string.IsNullOrEmpty(callerId)) return;
            if (_userConnections.TryGetValue(callerId, out var callerConnectionId))
            {
                await Clients.Client(callerConnectionId).SendAsync("CallAccepted", acceptingUserId);
            }
        }

        public async Task DeclineCall(string callerId)
        {
            var decliningUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(decliningUserId) || string.IsNullOrEmpty(callerId)) return;
            if (_userConnections.TryGetValue(callerId, out var callerConnectionId))
            {
                await Clients.Client(callerConnectionId).SendAsync("CallDeclined", decliningUserId);
            }
        }

        public async Task EndCall(string targetId)
        {
            var endingUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(endingUserId) || string.IsNullOrEmpty(targetId)) return;
            if (_userConnections.TryGetValue(targetId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("CallEnded", endingUserId);
            }
        }

        public async Task SendSDP(string targetId, string sdp)
        {
            var sdpOriginatorId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(sdpOriginatorId) || string.IsNullOrEmpty(targetId) || string.IsNullOrEmpty(sdp)) return;
            if (_userConnections.TryGetValue(targetId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceiveSDP", sdpOriginatorId, sdp);
            }
        }

        public async Task SendIceCandidate(string targetId, string candidate)
        {
            var senderUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderUserId) || string.IsNullOrEmpty(targetId) || string.IsNullOrEmpty(candidate)) return;
            if (_userConnections.TryGetValue(targetId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", senderUserId, candidate);
            }
        }

        public async Task JoinVoiceChannel(string channelId, string usernameFromClient)
        {
            var userId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(channelId))
            {
                Console.WriteLine($"VoiceHub: JoinVoiceChannel failed. Invalid userId or channelId. User: {userId}, Channel: {channelId}");
                return;
            }

            var appUser = await _userManager.FindByIdAsync(userId);
            if (appUser == null)
            {
                Console.WriteLine($"VoiceHub: JoinVoiceChannel failed. User not found in DB: {userId}");
                return;
            }

            string actualUsername = !string.IsNullOrWhiteSpace(appUser.UserName) ? appUser.UserName : usernameFromClient;
            string? avatarUrl = appUser.AvatarUrl;

            if (_userCurrentChannel.TryGetValue(userId, out var oldChannelId) && oldChannelId != channelId)
            {
                await LeaveVoiceChannelInternal(userId, connectionId, false, "switched_channel");
            }

            var userDto = new VoiceUserDto { Id = userId, Username = actualUsername, Image = avatarUrl, IsMuted = false, IsDeafened = false };
            var currentChannelUsers = _channelUsers.GetOrAdd(channelId, _ => new ConcurrentDictionary<string, VoiceUserDto>());
            currentChannelUsers[userId] = userDto;
            _userCurrentChannel[userId] = channelId;

            await Groups.AddToGroupAsync(connectionId, GetChannelGroupName(channelId));

            var channelState = new ChannelStateDto
            {
                ChannelId = channelId,
                Users = currentChannelUsers.Values.Where(u => u.Id != userId).ToList()
            };
            await Clients.Caller.SendAsync("ChannelState", channelState);
            await Clients.GroupExcept(GetChannelGroupName(channelId), connectionId).SendAsync("UserJoinedChannel", channelId, userDto);
        }

        public async Task LeaveVoiceChannel()
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) return;
            await LeaveVoiceChannelInternal(userId, Context.ConnectionId, false, "manual_leave");
        }

        public async Task SendChannelOffer(string targetUserId, string offerSdp)
        {
            var senderUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderUserId) || string.IsNullOrEmpty(targetUserId) || string.IsNullOrEmpty(offerSdp)) return;
            if (!_userCurrentChannel.TryGetValue(senderUserId, out var channelId)) return;
            if (_userConnections.TryGetValue(targetUserId, out var targetConnectionId))
                await Clients.Client(targetConnectionId).SendAsync("ReceiveChannelOffer", senderUserId, channelId, offerSdp);
        }

        public async Task SendChannelAnswer(string targetUserId, string answerSdp)
        {
            var senderUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderUserId) || string.IsNullOrEmpty(targetUserId) || string.IsNullOrEmpty(answerSdp)) return;
            if (!_userCurrentChannel.TryGetValue(senderUserId, out var channelId)) return;
            if (_userConnections.TryGetValue(targetUserId, out var targetConnectionId))
                await Clients.Client(targetConnectionId).SendAsync("ReceiveChannelAnswer", senderUserId, channelId, answerSdp);
        }

        public async Task SendChannelIceCandidate(string targetUserId, string candidate)
        {
            var senderUserId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderUserId) || string.IsNullOrEmpty(targetUserId) || string.IsNullOrEmpty(candidate)) return;
            if (!_userCurrentChannel.TryGetValue(senderUserId, out var channelId)) return;
            if (_userConnections.TryGetValue(targetUserId, out var targetConnectionId))
                await Clients.Client(targetConnectionId).SendAsync("ReceiveChannelIceCandidate", senderUserId, channelId, candidate);
        }

        public async Task UpdateUserVoiceStateInChannel(VoiceUserDto updatedVoiceState)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || updatedVoiceState == null || userId != updatedVoiceState.Id) return;

            if (_userCurrentChannel.TryGetValue(userId, out var channelId) &&
                _channelUsers.TryGetValue(channelId, out var usersInChannel) &&
                usersInChannel.TryGetValue(userId, out var currentUserState))
            {
                updatedVoiceState.Image = currentUserState.Image;
                updatedVoiceState.Username = currentUserState.Username;

                currentUserState.IsMuted = updatedVoiceState.IsMuted;
                currentUserState.IsDeafened = updatedVoiceState.IsDeafened;

                await Clients.GroupExcept(GetChannelGroupName(channelId), Context.ConnectionId)
                             .SendAsync("UserVoiceStateChanged", channelId, currentUserState);
            }
        }

        private async Task LeaveVoiceChannelInternal(string userId, string connectionId, bool isDisconnect, string reason)
        {
            if (_userCurrentChannel.TryRemove(userId, out var channelId))
            {
                try
                {
                    await Groups.RemoveFromGroupAsync(connectionId, GetChannelGroupName(channelId));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"VoiceHub: Error removing user {userId} from group {GetChannelGroupName(channelId)} on disconnect: {ex.Message}");
                }

                if (_channelUsers.TryGetValue(channelId, out var usersInChannel))
                {
                    usersInChannel.TryRemove(userId, out _);
                    await Clients.Group(GetChannelGroupName(channelId)).SendAsync("UserLeftChannel", channelId, userId, reason);
                    if (usersInChannel.IsEmpty) _channelUsers.TryRemove(channelId, out _);
                }
            }
        }
        private string GetChannelGroupName(string channelId) => $"voicechannel-{channelId}";
    }
}