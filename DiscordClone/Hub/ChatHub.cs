using DiscordClone.Db;
using DiscordClone.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace DiscordClone.Hubs
{
    [Authorize]
    public class ChatHub : Hub
{
    private readonly ApplicationContext _context;
    private readonly UserManager<User> _userManager;
        public ChatHub(ApplicationContext context, UserManager<User> userManager)
        {
              _context = context;
              _userManager = userManager;
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("ReceiveMessage", $"{Context.ConnectionId} has joined");
        }
        public async Task JoinChannel(string serverName, string channelName)
        {
            string groupName = $"{serverName}:{channelName}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ReceiveMessage", $"{Context.ConnectionId} joined {channelName} on {serverName}");
        }


        public async Task LeaveChannel(string serverName, string channelName)
        {
            string groupName = $"{serverName}:{channelName}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ReceiveMessage", $"{Context.ConnectionId} left {channelName} on {serverName}");
        }
        [Authorize]
        public async Task SendMessage(string userName, string message, string serverName, string channelName)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userName);
            var server = await _context.Servers.FirstOrDefaultAsync(u => u.Name == serverName);
            var channel = await _context.Channels.FirstOrDefaultAsync(u => u.Name == channelName);
            if (user == null || server == null || channel == null)
            {
                await Clients.Caller.SendAsync("ReceiveError", "Something went wrong!");
                return;
            }

            var newMessage = new Message
            {
                Content = message,
                Channel = channel,
                User = user
            };
            _context.Messages.Add(newMessage);
            await _context.SaveChangesAsync();

            string groupName = $"{serverName}:{channelName}";
            await Clients.Group(groupName).SendAsync("ReceiveMessage", new { id=newMessage.MessageId,userName = user.UserName, content = message, server=server.ServerId,channel=channel.ChannelId});
        }
    }
}
