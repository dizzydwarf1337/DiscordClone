using DiscordClone.Db;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public class FriendshipService
{
    private readonly ApplicationContext _context;
    private readonly ILogger<FriendshipService> _logger;
    public FriendshipService(ApplicationContext context, ILogger<FriendshipService> logger)
    {
        _context = context;
        _logger = logger;
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
        var friendshipRequest = await _context.Friendships.FirstOrDefaultAsync(x => (x.SenderId == friendsUsernameRequest.senderId && x.ReceiverId == user.Id) || (x.ReceiverId == friendsUsernameRequest.senderId && x.SenderId== user.Id));
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
        var requests = await _context.Friendships.Include(s=>s.Sender)
            .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();
        var requestDtos = requests.Select(r => new FriendRequestDto
        {
            requestId= r.Id,
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
}
