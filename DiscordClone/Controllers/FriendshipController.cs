using DiscordClone.Db;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FriendshipController : BaseController
    {
        private readonly FriendshipService _friendshipService;


        public FriendshipController(FriendshipService friendshipService)
        {
            _friendshipService = friendshipService;
        }

        // Endpoint to send a friend request
        [HttpPost("send")]
        public async Task<IActionResult> SendFriendRequest([FromBody] FriendRequestDto request)
        {
            return HandleResult( await _friendshipService.SendFriendRequestAsync(request.SenderId, request.ReceiverId));

        }
        [HttpPost("send/userName")]
        public async Task<IActionResult> SendFriendRequestByUserName(FriendsUsernameRequestDto friendsUsernameRequest)
        {
            return HandleResult(await _friendshipService.SendFriendRequestByUserName(friendsUsernameRequest));
        }
        // Endpoint to accept a friend request
        [HttpPost("accept")]
        public async Task<IActionResult> AcceptFriendRequest([FromBody] FriendRequestDto request)
        {
            return HandleResult(await _friendshipService.AcceptFriendRequestAsync(request.SenderId, request.ReceiverId));
        }

        // Endpoint to reject a friend request
        [HttpPost("reject")]
        public async Task<IActionResult> RejectFriendRequest([FromBody] FriendRequestDto request)
        {
            return HandleResult( await _friendshipService.RejectFriendRequestAsync(request.SenderId, request.ReceiverId));

        }

        // Endpoint to get a user's friends by their username
        [HttpGet("friends/{userId}")]
        public async Task<IActionResult> GetUserFriendsById(Guid userId)
        {
            return HandleResult(await _friendshipService.GetUserFriendsAsync(userId));
        }
        [HttpGet("requests/{userId}")]
        public async Task<IActionResult> GetUserFriendRequests(Guid userId)
        {
            return HandleResult(await _friendshipService.GetFriendsRequests(userId));
        }
        [HttpGet("friendsGroup/{userId}")]
        public async Task<IActionResult> GetFriendGroupsById(Guid userId)
        {
            return HandleResult(await _friendshipService.GetFriendGroupsById(userId));
        }

        [HttpDelete("remove/{userId}/{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid userId, Guid friendId)
        {
            return HandleResult(await _friendshipService.RemoveFriendAsync(userId, friendId));
        }

        [HttpPost("friendsGroup/create")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto createGroupDto)
        {
            if (createGroupDto == null || string.IsNullOrEmpty(createGroupDto.GroupName))
            {
                return BadRequest("Group name is required.");
            }

            // Pass the DTO to the service to create the group
            var result = await _friendshipService.CreateGroupAsync(createGroupDto.CreatorId, createGroupDto.GroupName);
            
            return HandleResult(result);
        }
        [HttpPost("friendsGroup/update/name")]
        public async Task<IActionResult> UpdateGroupName(UpdateGroupNameDto updateGroupDto)
        {
            return HandleResult(await _friendshipService.UpdateGroupName(updateGroupDto));
        }

        [HttpGet("friendsGroup/members/{groupId}")]
        public async Task<IActionResult> GetGroupMembers(Guid groupId)
        {
            return HandleResult(await _friendshipService.GetGroupMembersAsync(groupId));
        }
        [HttpPost("friendsGroup/remove/{groupId}")]
        public async Task<IActionResult> RemoveGroup(Guid groupId)
        {
            return HandleResult(await _friendshipService.RemoveGroupAsync(groupId));
        }

        [HttpPost("friendsGroup/leave/{groupId}/{userId}")]
        public async Task<IActionResult> LeaveGroup(Guid groupId, Guid userId)
        {
            return HandleResult(await _friendshipService.RemoveUserFromGroupAsync(userId, groupId));
        }


        [HttpPost("friendsGroup/add/{groupId}/{userId}")]
        public async Task<IActionResult> AddFriendToGroupById(Guid groupId, Guid userId)
        {
            return HandleResult(await _friendshipService.AddUserToGroupAsync(userId, groupId));
        }
    }
}
