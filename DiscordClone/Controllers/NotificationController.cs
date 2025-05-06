using DiscordClone.Hubs;
using DiscordClone.Models.Dtos;
using DiscordClone.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public NotificationController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("send-test")]
    public async Task<IActionResult> SendNotification([FromBody] NotificationDto notificationDto)
    {
        if (notificationDto == null || notificationDto.ReceiversId == null || !notificationDto.ReceiversId.Any())
        {
            return BadRequest("Invalid notification data.");
        }

        var result = await _notificationService.SendNotification(notificationDto);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Message);
        }

        return Ok("Notification sent successfully.");
    }
}