using DiscordClone.Db;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Services;
using DiscordClone.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public class FriendshipService
{
    private readonly ApplicationContext _context;
    private readonly ILogger<FriendshipService> _logger;
    private readonly NotificationService _notificattionService;
    public FriendshipService(ApplicationContext context, ILogger<FriendshipService> logger, NotificationService notificattionService)
    {
        _context = context;
        _logger = logger;
        _notificattionService = notificattionService;
    }

    // Wysyłanie zaproszenia do przyjaźni
    public async Task<Result<bool>> SendFriendRequestAsync(Guid senderId, Guid receiverId)
    {
        var existingRequest = await _context.Friendships
            .FirstOrDefaultAsync(f => (f.SenderId == senderId && f.ReceiverId == receiverId) || (f.SenderId == receiverId && f.ReceiverId == senderId));

        if (existingRequest != null)
        {
            // throw new InvalidOperationException("Friendship request already exists.");
            return Result<bool>.Failure("Friendship request already exists");
        }

        var friendship = new Friendship
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Status = FriendshipStatus.Pending
        };

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
    public async Task<Result<bool>> SendFriendRequestByUserName(FriendsUsernameRequestDto friendsUsernameRequest)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == friendsUsernameRequest.userName);
        _logger.LogInformation("Received friend request: SenderId={SenderId}, UserName={UserName}",
        friendsUsernameRequest.senderId, friendsUsernameRequest.userName);
        if (user == null)
        {
            return Result<bool>.Failure("User not found");
        }
        _logger.LogInformation("Found user: ReceiverId={ReceiverId}, SenderId={SenderId}",
        user.Id, friendsUsernameRequest.senderId);
        var friendshipRequest = await _context.Friendships.FirstOrDefaultAsync(x => (x.SenderId == friendsUsernameRequest.senderId && x.ReceiverId == user.Id) || (x.ReceiverId == friendsUsernameRequest.senderId && x.SenderId == user.Id));
        if (friendshipRequest != null)
        {
            return Result<bool>.Failure("Friendship request already exists");
        }
        var friendship = new Friendship
        {
            SenderId = friendsUsernameRequest.senderId,
            ReceiverId = user.Id,
            Status = FriendshipStatus.Pending,
        };
        await _context.Friendships.AddAsync(friendship);
        await _context.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
    // Akceptowanie zaproszenia do przyjaźni
    public async Task<Result<bool>> AcceptFriendRequestAsync(Guid senderId, Guid receiverId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId && f.Status == FriendshipStatus.Pending);

        if (friendship == null)
        {
            return Result<bool>.Failure("Cannot accept friedship request");
        }

        friendship.Status = FriendshipStatus.Accepted;
        friendship.AcceptedAt = DateTime.UtcNow;
        _context.Friendships.Update(friendship);
        await _context.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    // Odrzucenie zaproszenia
    public async Task<Result<bool>> RejectFriendRequestAsync(Guid senderId, Guid receiverId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId && f.Status == FriendshipStatus.Pending);

        if (friendship == null)
        {
            return Result<bool>.Failure("no friendship found");
        }

        friendship.Status = FriendshipStatus.Rejected;

        await _context.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
    public async Task<Result<ICollection<FriendRequestDto>>> GetFriendsRequests(Guid userId)
    {
        var requests = await _context.Friendships.Include(s => s.Sender)
            .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();
        var requestDtos = requests.Select(r => new FriendRequestDto
        {
            requestId = r.Id,
            SenderId = r.SenderId,
            ReceiverId = r.ReceiverId,
            UserName = r.Sender.UserName,
            Image = r.Sender.AvatarUrl
        }).ToList();
        return Result<ICollection<FriendRequestDto>>.Success(requestDtos);
    }
    public async Task<Result<ICollection<UserDto>>> GetUserFriendsAsync(Guid userId)
    {
        _logger.LogInformation("Getting friends for user: {UserId}", userId);
        var friendshipsSended = await _context.Friendships.Where(x => (x.SenderId == userId && x.Status == FriendshipStatus.Accepted)).ToListAsync();
        var friendshipsReceived = await _context.Friendships.Where(x => (x.ReceiverId == userId && x.Status == FriendshipStatus.Accepted)).ToListAsync();
        List<User> friends = new();
        foreach (var friendship in friendshipsSended)
        {
            var friend = await _context.Users.FirstOrDefaultAsync(u => u.Id == friendship.ReceiverId);
            friends.Add(friend);
            _logger.LogInformation("Friend: {Friend}", friend.UserName);
        }
        foreach (var friendship in friendshipsReceived)
        {
            var friend = await _context.Users.FirstOrDefaultAsync(u => u.Id == friendship.SenderId);
            friends.Add(friend);
            _logger.LogInformation("Friend: {Friend}", friend.UserName);
        }

        var friendsDto = friends.Select(f => new UserDto
        {
            Id = f.Id.ToString(),
            Email = f.Email,
            Image = f.AvatarUrl,
            Username = f.UserName,
        }).ToList();
        _logger.LogInformation("Friends: {Friends}", friendsDto);
        return Result<ICollection<UserDto>>.Success(friendsDto);
    }

    public async Task<Result<ICollection<FriendGroupDto>>> GetFriendGroupsById(Guid userId)
    {
        _logger.LogInformation("Getting friend groups for user: {UserId}", userId);

        // Fetching friend groups where the user is either the creator or a member
        var groups = await _context.FriendGroups
            .Where(g => g.CreatorId == userId || g.Members.Any(m => m.Id == userId))
            .Include(g => g.Members)  // Load the members of each group
            .ToListAsync();

        // Mapping the result to DTOs
        var groupDtos = groups.Select(g => new FriendGroupDto
        {
            Id = g.Id,
            Name = g.Name,
            CreatorId = g.CreatorId,
            Members = g.Members.Select(m => new UserDto
            {
                Id = m.Id.ToString(),
                Username = m.UserName,
                Image = m.AvatarUrl
            }).ToList()
        }).ToList();

        _logger.LogInformation("Found {GroupCount} friend groups for user: {UserId}", groups.Count, userId);

        return Result<ICollection<FriendGroupDto>>.Success(groupDtos);
    }

    // Creating a new Friend Group
    public async Task<Result<FriendGroupDto>> CreateGroupAsync(Guid creatorId, string groupName)
    {
        _logger.LogInformation("Creating new group by user: {CreatorId}", creatorId);

        // Check if the user exists
        var user = await _context.Users.FindAsync(creatorId);
        if (user == null)
        {
            return Result<FriendGroupDto>.Failure("User not found.");
        }

        // Create a new group
        var group = new FriendGroup
        {
            Id = Guid.NewGuid(), // Generating a new unique group ID
            Name = groupName,
            CreatorId = creatorId,
            Members = new List<User> { user } // Initially add the creator as the first member
        };

        // Add the group to the context
        _context.FriendGroups.Add(group);

        // Save the changes to the database
        await _context.SaveChangesAsync();

        _logger.LogInformation("New group created with creator: {CreatorId} groupId: {GroupId}", creatorId, group.Id);

        // Return a DTO with the created group
        var groupDto = new FriendGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            CreatorId = group.CreatorId,
            Members = new List<UserDto>
            {
                new UserDto
                {
                    Id = user.Id.ToString(),
                    Username = user.UserName,
                    Image = user.AvatarUrl
                }
            }
        };

        return Result<FriendGroupDto>.Success(groupDto);
    }

    // Retrieving Members of a Friend Group
    public async Task<Result<List<UserDto>>> GetGroupMembersAsync(Guid groupId)
    {
        _logger.LogInformation("Fetching members for group: {GroupId}", groupId);

        var group = await _context.FriendGroups
            .Include(g => g.Members) 
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
        {
            return Result<List<UserDto>>.Failure("Group not found.");
        }

        var groupMembers = group.Members.Select(m => new UserDto
        {
            Id = m.Id.ToString(),
            Username = m.UserName,
            Image = m.AvatarUrl
        }).ToList();

        _logger.LogInformation("Fetched {MemberCount} members for group: {GroupId}", groupMembers.Count, groupId);

        return Result<List<UserDto>>.Success(groupMembers);
    }
    // Adding a User to a Friend Group
    public async Task<Result<bool>> AddUserToGroupAsync(Guid userId, Guid groupId)
    {
        _logger.LogInformation("Adding user: {UserId} to group: {GroupId}", userId, groupId);

        var group = await _context.FriendGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
        {
            return Result<bool>.Failure("Group not found.");
        }

        // Check if the user is already a member
        if (group.Members.Any(m => m.Id == userId))
        {
            return Result<bool>.Failure("User is already a member of this group.");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Result<bool>.Failure("User not found.");
        }

        group.Members.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User: {UserId} added to group: {GroupId}", userId, groupId);

        var notification = new NotificationDto
        {
            ReceiversId = new List<Guid> { userId },
            Type = "AddedToGroup",
            Payload = new
            {
                GroupId = groupId,
                GroupName = group.Name,
                AddedBy = userId
            }
        };
        await _notificattionService.SendNotification(notification);
        
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> UpdateGroupName(UpdateGroupNameDto updateGroupDto)
    {
        try
        {
            // Retrieve the group from the database by its GroupId
            var group = await _context.FriendGroups
                .FirstOrDefaultAsync(g => g.Id == updateGroupDto.GroupId);

            if (group == null)
            {
                return Result<bool>.Failure("Group not found.");
            }

            // Update the group's name
            group.Name = updateGroupDto.GroupName;

            // Save the changes to the database
            await _context.SaveChangesAsync();

            _logger.LogInformation("Group name updated successfully for group: {GroupId}", updateGroupDto.GroupId);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating group name for group: {GroupId}", updateGroupDto.GroupId);
            return Result<bool>.Failure("An error occurred while updating the group name.");
        }
    }
    public async Task<Result<string>> RemoveGroupAsync(Guid groupId)
    {
        _logger.LogInformation("Removing group: {GroupId}", groupId);

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {

            var group = await _context.FriendGroups
                .Include(g => g.Members) 
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                return Result<string>.Failure("Group not found.");
            }

  
            group.Members.Clear(); 

            _context.FriendGroups.Remove(group);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Group: {GroupId} removed successfully", groupId);
            return Result<string>.Success("Group deleted successfully");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error removing group {GroupId}", groupId);
            return Result<string>.Failure(ex.InnerException?.Message ?? "Error removing group");
        }
    }

    public async Task<Result<bool>> RemoveUserFromGroupAsync(Guid userId, Guid groupId)
    {
        _logger.LogInformation("Removing user: {UserId} from group: {GroupId}", userId, groupId);

        try
        {
            var isCreator = await _context.FriendGroups
                .AnyAsync(g => g.Id == groupId && g.CreatorId == userId);

            if (isCreator)
            {
                return Result<bool>.Failure("Cannot remove the creator from the group.");
            }

            var group = await _context.FriendGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                return Result<bool>.Failure("Group not found.");
            }

            var user = group.Members.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return Result<bool>.Failure("User is not a member of this group.");
            }

            group.Members.Remove(user);

            await _context.SaveChangesAsync();

            _logger.LogInformation("User: {UserId} removed from group: {GroupId}", userId, groupId);
            var notification = new NotificationDto
            {
                ReceiversId = new List<Guid> { userId },
                Type = "KickedFromGroup",
                Payload = new
                {
                    GroupId = groupId,
                    GroupName = group.Name,
                    RemovedBy = userId
                }
            };
            await _notificattionService.SendNotification(notification);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user {UserId} from group {GroupId}", userId, groupId);
            return Result<bool>.Failure(ex.InnerException?.Message ?? "Error removing user from group");
        }
    }



}
