using DiscordClone.Models.Dtos;
using DiscordClone.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : BaseController
    {
        private readonly MessageService _messageService;

        public MessageController(MessageService messageService)
        {
            _messageService = messageService;
        }

        // POST: api/message/send
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage( MessageDto messageDto)
        {
            try
            {
                await _messageService.SendMessageAsync(messageDto);
                return Ok(new { message = "Message sent successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/message/{channelId}
        [HttpGet("{channelId}")]
        public async Task<IActionResult> GetAllMessages(Guid channelId)
        {
            return HandleResult(await _messageService.GetAllMessagesAsync(channelId));

        }
        // GET: api/message/{channelId}/last/{days}
        [HttpGet("{channelId}/last/{days}")]
        public async Task<IActionResult> GetMessagesFromLastNDays(Guid channelId, int days)
        {
            var result = await _messageService.GetMessagesFromLastNDays(channelId, days);
            return HandleResult(result);
        }
    }
}
