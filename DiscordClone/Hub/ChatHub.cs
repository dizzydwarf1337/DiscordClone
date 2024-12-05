using DiscordClone.Db;
using DiscordClone.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace DiscordClone.Hubs
{
    //[Authorize]
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
            var user = Context.User;

            if (user?.Identity?.IsAuthenticated == true)
            {
                var userId = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var userName = user.Identity.Name;
                await Clients.All.SendAsync("ReceiveMessage", new { content = $"{userName} has joined" });
                await base.OnConnectedAsync();
            }
            else
            {
                Context.Abort();
            }
        }
        public async Task JoinChannel(string serverName, string channelName)
        {
            string groupName = $"{serverName}:{channelName}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ReceiveMessage", new { content=$"{Context.ConnectionId} joined {channelName} on {serverName}" });
        }


        public async Task LeaveChannel(string serverName, string channelName = "Default")
        {
            string groupName = $"{serverName}:{channelName}";
            Console.WriteLine(groupName);
            var server = await _context.Servers.FirstOrDefaultAsync(u => u.Name == serverName);
            Console.WriteLine(server);
            var channel = await _context.Channels.FirstOrDefaultAsync(u => u.Name == channelName);
            Console.WriteLine(channel);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == "admin");
            var leaveMessage = new Message { MessageId = Guid.NewGuid(), User=user, Content = "User left the channel", ChannelId = channel.ChannelId };
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ReceiveMessage", leaveMessage);
            await _context.Messages.AddAsync(leaveMessage);
            await _context.SaveChangesAsync();
        }
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
            await Clients.Group(groupName).SendAsync("ReceiveMessage", new { MessageId = newMessage.MessageId, userName = user.UserName, Content = newMessage.Content   , channelId = channel.ChannelId, serverId=server.ServerId });
        }
    }
}
