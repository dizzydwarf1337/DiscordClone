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

        // Endpoint to send a friend request
        [HttpPost("send")]
        public async Task<IActionResult> SendFriendRequest([FromBody] FriendRequestDto request)
        {
            try
            {
                bool requestExists = await _friendshipService.SendFriendRequestAsync(request.SenderId, request.ReceiverId);

                if (requestExists)
                {
                    return BadRequest(new { success = false, message = "Friendship request already exists." });
                }

                return Ok(new { success = true, message = "Friend request sent successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        // Endpoint to accept a friend request
        [HttpPost("accept")]
        public async Task<IActionResult> AcceptFriendRequest([FromBody] FriendRequestDto request)
        {
            bool success = await _friendshipService.AcceptFriendRequestAsync(request.SenderId, request.ReceiverId);

            if (!success)
            {
                return NotFound(new { success = false, message = "Friendship request not found or already accepted." });
            }

            return Ok(new { success = true, message = "Friend request accepted." });
        }

        // Endpoint to reject a friend request
        [HttpPost("reject")]
        public async Task<IActionResult> RejectFriendRequest([FromBody] FriendRequestDto request)
        {
            bool success = await _friendshipService.RejectFriendRequestAsync(request.SenderId, request.ReceiverId);

            if (!success)
            {
                return NotFound(new { success = false, message = "Friendship request not found." });
            }

            return Ok(new { success = true, message = "Friend request rejected." });
        }

        // Endpoint to get a user's friends by their username
        [HttpGet("friends/{userName}")]
        public async Task<IActionResult> GetUserFriendsByName(string userName)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userName);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found." });
            }

            List<User> friends = await _friendshipService.GetUserFriendsAsync(user.Id);

            if (friends == null || friends.Count == 0)
            {
                return NotFound(new { success = false, message = "No friends found." });
            }

            return Ok(new { success = true, friends });
        }
    }
}
