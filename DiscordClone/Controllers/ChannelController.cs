using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiscordClone.Models;
using DiscordClone.Db;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChannelsController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public ChannelsController(ApplicationContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateChannel([FromBody] ChannelCreateDto channelDto)
        {
            // Sprawdzanie, czy serwer istnieje
            var server = await _context.Servers.FindAsync(channelDto.ServerId);
            if (server == null)
            {
                return BadRequest("Server not found.");
            }

            var channel = new Channel
            {
                Name = channelDto.Name,
                ChannelType = channelDto.ChannelType ?? "text",
                ServerId = channelDto.ServerId,
                Topic = channelDto.Topic,
                CreatedAt = DateTime.UtcNow
            };

            _context.Channels.Add(channel);
            await _context.SaveChangesAsync();

            return Ok(channel);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Channel>> GetChannel(Guid id)
        {
            var channel = await _context.Channels
                .Include(c => c.Server)
                .FirstOrDefaultAsync(c => c.ChannelId == id);

            if (channel == null)
            {
                return NotFound();
            }

            return channel;
        }

        [HttpGet("server/{serverId}")]
        public async Task<ActionResult<IEnumerable<Channel>>> GetChannelsByServer(Guid serverId)
        {
            var channels = await _context.Channels
                .Where(c => c.ServerId == serverId)
                .ToListAsync();

            return channels;
        }
    }

    
}
