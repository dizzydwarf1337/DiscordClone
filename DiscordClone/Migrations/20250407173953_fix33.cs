using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class fix33 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_FriendGroups_FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.CreateTable(
                name: "FriendGroupUser",
                columns: table => new
                {
                    FriendGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FriendGroupUser", x => new { x.FriendGroupId, x.UserId });
                    table.ForeignKey(
                        name: "FK_FriendGroupUser_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FriendGroupUser_FriendGroups_FriendGroupId",
                        column: x => x.FriendGroupId,
                        principalTable: "FriendGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FriendGroupUser_UserId",
                table: "FriendGroupUser",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FriendGroupUser");

            migrationBuilder.AddColumn<Guid>(
                name: "FriendGroupId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_FriendGroupId",
                table: "AspNetUsers",
                column: "FriendGroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_FriendGroups_FriendGroupId",
                table: "AspNetUsers",
                column: "FriendGroupId",
                principalTable: "FriendGroups",
                principalColumn: "Id");
        }
    }
}
