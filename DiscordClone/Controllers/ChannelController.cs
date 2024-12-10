using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Services.ServerOperations;
using DiscordClone.Utils;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Route("api/[controller]")]
    public class ChannelController : BaseController
    {
        private readonly IChannelOperationsService _channelOperationsService;

        public ChannelController(IChannelOperationsService channelOperationsService)
        {
            _channelOperationsService = channelOperationsService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateChannel([FromBody] ChannelCreateDto channelDto)
        {
            var result = await _channelOperationsService.CreateChannelAsync(channelDto);
            return HandleResult(result);
            }

        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteChannel([FromQuery] Guid channelId)
            {
            var result = await _channelOperationsService.DeleteChannelByIdAsync(channelId);
            return HandleResult(result);
        }

        [HttpGet("messages")]
        public async Task<IActionResult> GetAllMessages([FromQuery] Guid channelId)
            {
            var result = await _channelOperationsService.GetAllMessagesAsync(channelId);
            return HandleResult(result);
        }

        [HttpGet("messagesLastDays")]
        public async Task<IActionResult> GetMessagesFromLastNDays([FromQuery] Guid channelId, [FromQuery] int days)
        {
            var result = await _channelOperationsService.GetMessagesFromLastNDays(channelId, days);
            return HandleResult(result);
        }
    }

    
}
