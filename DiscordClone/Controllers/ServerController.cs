using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Services.ServerOperations;
using DiscordClone.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class ServerController : BaseController
    {
        private readonly IServerOperationsService _serverOperationsService;

        public ServerController(IServerOperationsService serverOperationsService)
        {
            _serverOperationsService = serverOperationsService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateServer([FromBody] ServerCreateDto serverDto)
        {
            var result = await _serverOperationsService.CreateServerAsync(serverDto);
            return HandleResult(result);
            }

        [HttpPost("join")]
        public async Task<IActionResult> JoinServer([FromQuery] Guid userId, [FromQuery] Guid serverId)
            {
            var result = await _serverOperationsService.JoinServerAsync(userId, serverId);
            return HandleResult(result);
        }

        [HttpPost("leave")]
        public async Task<IActionResult> LeaveServer([FromQuery] Guid userId, [FromQuery] Guid serverId)
        {
            var result = await _serverOperationsService.LeaveServerAsync(userId, serverId);
            return HandleResult(result);
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteServer([FromQuery] Guid userId, [FromQuery] Guid serverId)
            {
            var result = await _serverOperationsService.DeleteServerAsync(userId, serverId);
            return HandleResult(result);
            }

        [HttpPost("ban")]
        public async Task<IActionResult> BanUser(ServerBanDto serverban)
        {
            var result = await _serverOperationsService.BanUserAsync(serverban);
            return HandleResult(result);
        }

        [HttpPost("unban")]
        public async Task<IActionResult> UnbanUser([FromBody] UnbanActionDto unbanAction)
        {
            var result = await _serverOperationsService.RemoveBanAsync(unbanAction.ServerId, unbanAction.RemoverId, unbanAction.BannedUserId);
            return HandleResult(result);
        }


    }
}