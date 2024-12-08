using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiscordClone.Models;
using DiscordClone.Db;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServersController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public ServersController(ApplicationContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateServer([FromBody] ServerCreateDto serverDto)
        {
            // Sprawdzanie, czy użytkownik z OwnerId istnieje
            var owner = await _context.Users.FindAsync(serverDto.OwnerId);
            if (owner == null)
            {
                return BadRequest("Owner not found.");
            }

            var server = new Server
            {
                Name = serverDto.Name,
                Description = serverDto.Description,
                IconUrl = serverDto.IconUrl,
                IsPublic = serverDto.IsPublic,
                OwnerId = serverDto.OwnerId, // OwnerId musi być ustawione
                Owner = owner  // Powiąż właściciela
            };

            _context.Servers.Add(server);
            await _context.SaveChangesAsync();

            return Ok(server);
        }



        // GET: api/servers/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Server>> GetServer(Guid id)
        {
            var server = await _context.Servers
                .Include(s => s.Channels)
                .Include(s => s.Owner)
                .FirstOrDefaultAsync(s => s.ServerId == id);

            if (server == null)
            {
                return NotFound();
            }

            return server;
        }

        // GET: api/servers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Server>>> GetServers()
        {
            return await _context.Servers
                .Include(s => s.Channels)
                .Include(s => s.Owner)
                .ToListAsync();
        }


    }
}