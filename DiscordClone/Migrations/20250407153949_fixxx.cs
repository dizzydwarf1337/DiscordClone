using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class fixxx : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PrivateMessages_AspNetUsers_SenderId",
                table: "PrivateMessages");

            migrationBuilder.AddColumn<Guid>(
                name: "GroupMessageMessageId",
                table: "Reactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FriendGroupId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FriendGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FriendGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FriendGroups_AspNetUsers_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GroupMessages",
                columns: table => new
                {
                    MessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMessages", x => x.MessageId);
                    table.ForeignKey(
                        name: "FK_GroupMessages_AspNetUsers_SenderId",
                        column: x => x.SenderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMessages_FriendGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FriendGroups",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reactions_GroupMessageMessageId",
                table: "Reactions",
                column: "GroupMessageMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_FriendGroupId",
                table: "AspNetUsers",
                column: "FriendGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_FriendGroups_CreatorId",
                table: "FriendGroups",
                column: "CreatorId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessages_GroupId",
                table: "GroupMessages",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessages_SenderId",
                table: "GroupMessages",
                column: "SenderId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_FriendGroups_FriendGroupId",
                table: "AspNetUsers",
                column: "FriendGroupId",
                principalTable: "FriendGroups",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PrivateMessages_AspNetUsers_SenderId",
                table: "PrivateMessages",
                column: "SenderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reactions_GroupMessages_GroupMessageMessageId",
                table: "Reactions",
                column: "GroupMessageMessageId",
                principalTable: "GroupMessages",
                principalColumn: "MessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_FriendGroups_FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_PrivateMessages_AspNetUsers_SenderId",
                table: "PrivateMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_Reactions_GroupMessages_GroupMessageMessageId",
                table: "Reactions");

            migrationBuilder.DropTable(
                name: "GroupMessages");

            migrationBuilder.DropTable(
                name: "FriendGroups");

            migrationBuilder.DropIndex(
                name: "IX_Reactions_GroupMessageMessageId",
                table: "Reactions");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GroupMessageMessageId",
                table: "Reactions");

            migrationBuilder.DropColumn(
                name: "FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.AddForeignKey(
                name: "FK_PrivateMessages_AspNetUsers_SenderId",
                table: "PrivateMessages",
                column: "SenderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
