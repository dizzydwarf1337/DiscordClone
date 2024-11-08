using Microsoft.AspNetCore.Mvc;
using DiscordClone.Models;
using DiscordClone.Db; 
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationContext _context; // Używamy ApplicationContext

        public MessagesController(ApplicationContext context)
        {
            _context = context;
        }

        // GET: api/messages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Message>>> GetMessages()
        {
            return await _context.Messages
                .Include(m => m.User)
                .Include(m => m.Channel)
                .ToListAsync();
        }

        // GET: api/messages/{id}
        //[HttpGet("{id}")]
        //public async Task<ActionResult<Message>> GetMessage(Guid id)
        //{
        //    var message = await _context.Messages
        //        .Include(m => m.User)
        //        .Include(m => m.Channel)
        //        .FindAsync(id);

        //    if (message == null)
        //    {
        //        return NotFound();
        //    }

        //    return message;
        //}

        // POST: api/messages
        //[HttpPost]
        //public async Task<ActionResult<Message>> PostMessage(Message message)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return BadRequest(ModelState);
        //    }

        //    _context.Messages.Add(message);
        //    await _context.SaveChangesAsync();

        //    return CreatedAtAction(nameof(GetMessage), new { id = message.MessageId }, message);
        //}

        // PUT: api/messages/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMessage(Guid id, Message message)
        {
            if (id != message.MessageId)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Entry(message).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MessageExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/messages/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(Guid id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound();
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MessageExists(Guid id)
        {
            return _context.Messages.Any(e => e.MessageId == id);
        }
    }
}
