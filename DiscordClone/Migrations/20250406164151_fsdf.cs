using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class fsdf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FriendGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FriendGroups_AspNetUsers_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_FriendGroupId",
                table: "AspNetUsers",
                column: "FriendGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_FriendGroups_CreatorId",
                table: "FriendGroups",
                column: "CreatorId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_FriendGroups_FriendGroupId",
                table: "AspNetUsers",
                column: "FriendGroupId",
                principalTable: "FriendGroups",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_FriendGroups_FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "FriendGroups");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_FriendGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "FriendGroupId",
                table: "AspNetUsers");
        }
    }
}
