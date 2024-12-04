using DiscordClone.Db;
using DiscordClone.Models;
using Microsoft.EntityFrameworkCore;

public class FriendshipService
{
    private readonly ApplicationContext _context;

    public FriendshipService(ApplicationContext context)
    {
        _context = context;
    }

    // Wysyłanie zaproszenia do przyjaźni
    public async Task<bool> SendFriendRequestAsync(Guid senderId, Guid receiverId)
    {
        var existingRequest = await _context.Friendships
            .FirstOrDefaultAsync(f => (f.SenderId == senderId && f.ReceiverId == receiverId) || (f.SenderId == receiverId && f.ReceiverId == senderId));

        if (existingRequest != null)
        {
           // throw new InvalidOperationException("Friendship request already exists.");
            return true;
        }

        var friendship = new Friendship
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Status = FriendshipStatus.Pending
        };

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        return false;
    }

    // Akceptowanie zaproszenia do przyjaźni
    public async Task<bool> AcceptFriendRequestAsync(Guid senderId, Guid receiverId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId && f.Status == FriendshipStatus.Pending);

        if (friendship == null)
        {
            return false;
            //     throw new InvalidOperationException("Friendship request not found or already accepted.");
        }

        friendship.Status = FriendshipStatus.Accepted;
        friendship.AcceptedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // Odrzucenie zaproszenia
    public async Task<bool> RejectFriendRequestAsync(Guid senderId, Guid receiverId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId && f.Status == FriendshipStatus.Pending);

        if (friendship == null)
        {
            return false;
            // throw new InvalidOperationException("Friendship request not found.");
        }

        friendship.Status = FriendshipStatus.Rejected;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<User>> GetUserFriendsAsync(Guid userId)
    {
        var friendships = await _context.Friendships
            .Where(f => (f.SenderId == userId || f.ReceiverId == userId) && f.Status == FriendshipStatus.Accepted)
            .ToListAsync();

        var friendIds = friendships
            .Select(f => f.SenderId == userId ? f.ReceiverId : f.SenderId)
            .ToList();

        var friends = await _context.Users
            .Where(u => friendIds.Contains(u.Id))
            .ToListAsync();

        return friends;
    }
}
