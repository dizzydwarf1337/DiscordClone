using DiscordClone.Services.ServerOperations;
using DiscordClone.Models.Dtos;
using Microsoft.AspNetCore.SignalR;

namespace DiscordClone.Hubs
{
    public class ChatHub : Hub
    {

        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;
            await Clients.All.SendAsync("ReceiveMessage", new
            {
                content = $"{connectionId} has joined"
            });
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

        public async Task SendMessage(MessageDto messageDto, string groupName)
        {
            await Clients.Group(groupName).SendAsync("ReceiveMessage", messageDto);
        }
    }
}
