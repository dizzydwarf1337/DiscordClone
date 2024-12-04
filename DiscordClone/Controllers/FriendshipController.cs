using DiscordClone.Models;
using DiscordClone.Db;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using DiscordClone.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FriendshipController : ControllerBase
    {
        private readonly FriendshipService _friendshipService;
        private readonly ApplicationContext _context;

        public FriendshipController(FriendshipService friendshipService, ApplicationContext context)
        {
            _friendshipService = friendshipService;
            _context = context; 

        }

        [HttpPost("send")]
        public async Task<IActionResult> SendFriendRequest([FromBody] FriendRequestDto request)
        {
            try
            {
                bool requestExists = await _friendshipService.SendFriendRequestAsync(request.SenderId, request.ReceiverId);

                if (requestExists)
                {
                    return BadRequest("Friendship request already exists.");
                }

                return Ok("Friend request sent successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("accept")]
        public async Task<IActionResult> AcceptFriendRequest([FromBody] FriendRequestDto request)
        {
            bool success = await _friendshipService.AcceptFriendRequestAsync(request.SenderId, request.ReceiverId);

            if (!success)
            {
                return NotFound("Friendship request not found or already accepted.");
            }

            return Ok("Friend request accepted.");
        }

        [HttpPost("reject")]
        public async Task<IActionResult> RejectFriendRequest([FromBody] FriendRequestDto request)
        {
            bool success = await _friendshipService.RejectFriendRequestAsync(request.SenderId, request.ReceiverId);

            if (!success)
            {
                return NotFound("Friendship request not found.");
            }

            return Ok("Friend request rejected.");
        }

        [HttpGet("friends/{userName}")]
        public async Task<IActionResult> GetUserFriendsByName(string userName)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userName);
            if (user == null)
            {
                return NotFound("User not found.");
            }
            List<User> friends = await _friendshipService.GetUserFriendsAsync(user.Id);

            if (friends == null || friends.Count == 0)
            {
                return NotFound("No friends found.");
            }

            return Ok(friends);
        }
    }
}
