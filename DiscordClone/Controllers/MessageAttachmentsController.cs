using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessageAttachmentsController : ControllerBase
    {
        private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB limit
        private const string UploadsFolder = "wwwroot/uploads";
        private readonly ApplicationContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly NotificationService _notificationService;

        public MessageAttachmentsController(ApplicationContext context, IHubContext<ChatHub> hubContext, NotificationService notificationService)
        {
            _notificationService = notificationService;
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessageWithAttachments([FromForm] string content,
                                                                 [FromForm] Guid channelId,
                                                                 [FromForm] Guid senderId,
                                                                 IFormFileCollection files)
        {
            try
            {
                // 1. Create and save the message first
                var user = await _context.Users.FindAsync(senderId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                var channel = await _context.Channels.FindAsync(channelId);
                if (channel == null)
                {
                    return NotFound("Channel not found");
                }

                var message = new Message
                {
                    MessageId = Guid.NewGuid(),
                    Content = content,
                    CreatedAt = DateTime.UtcNow,
                    UserId = senderId,
                    ChannelId = channelId,
                    Attachments = new List<Attachment>()
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                // 2. Process and save attachments
                List<AttachmentDto> attachmentDtos = new List<AttachmentDto>();

                if (files != null && files.Count > 0)
                {
                    // Ensure the uploads directory exists
                    if (!Directory.Exists(UploadsFolder))
                    {
                        Directory.CreateDirectory(UploadsFolder);
                    }

                    foreach (var file in files)
                    {
                        // Validate file size
                        if (file.Length > MaxFileSize)
                        {
                            continue; // Skip files that are too large
                        }

                        // Generate a unique file name
                        string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                        string filePath = Path.Combine(UploadsFolder, uniqueFileName);

                        // Save the file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        // Create attachment record
                        var attachment = new Attachment
                        {
                            AttachmentId = Guid.NewGuid(),
                            AttachmentUrl = $"/uploads/{uniqueFileName}",
                            AttachmentType = GetAttachmentType(file.ContentType),
                            MessageId = message.MessageId
                        };

                        _context.Attachments.Add(attachment);

                        // Add to DTOs list for response
                        attachmentDtos.Add(new AttachmentDto
                        {
                            AttachmentId = attachment.AttachmentId,
                            AttachmentUrl = attachment.AttachmentUrl,
                            AttachmentType = attachment.AttachmentType.ToString()
                        });
                    }

                    await _context.SaveChangesAsync();

                }

                // 3. Prepare message DTO for SignalR broadcast
                var messageDto = new MessageDto
                {
                    MessageId = message.MessageId,
                    Content = message.Content,
                    CreatedAt = message.CreatedAt,
                    ChannelId = message.ChannelId,
                    SenderId = message.UserId,
                    SenderName = user.UserName,
                    Attachments = attachmentDtos,
                    Reactions = new List<ReactionDto>()
                };



                // 4. Get the group name for the channel
                var server = await _context.Servers
                    .Where(s => s.Channels.Any(c => c.ChannelId == channelId))
                    .FirstOrDefaultAsync();

                if (server != null)
                {
                    string groupName = $"{server.ServerId}:{channelId}";
                    await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", messageDto);
                    
                    var ids = server.ServerMembers.Select(sm => sm.UserId).ToList();

                    var notification = new NotificationDto
                    {
                        ReceiversId = ids,
                        Type = "ChannelMessageWithAttachment",
                        Payload = new 
                        {
                        }
                    };

                    await _notificationService.SendNotification(notification);
                }
                else
                {
                    await _hubContext.Clients.All.SendAsync("ReceiveMessage", messageDto);
                }

                return Ok(messageDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private AttachmentTypeEnum GetAttachmentType(string contentType)
        {
            if (contentType.StartsWith("image"))
                return AttachmentTypeEnum.Image;
            if (contentType.StartsWith("application/pdf") ||
                contentType.StartsWith("text/") ||
                contentType.StartsWith("application/msword") ||
                contentType.StartsWith("application/vnd.openxmlformats-officedocument"))
                return AttachmentTypeEnum.Document;

            return AttachmentTypeEnum.Unknown;
        }

    }
}
