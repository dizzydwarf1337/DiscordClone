using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class readBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Read",
                table: "PrivateMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "GroupMessageMessageId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_GroupMessageMessageId",
                table: "AspNetUsers",
                column: "GroupMessageMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_GroupMessages_GroupMessageMessageId",
                table: "AspNetUsers",
                column: "GroupMessageMessageId",
                principalTable: "GroupMessages",
                principalColumn: "MessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_GroupMessages_GroupMessageMessageId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_GroupMessageMessageId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Read",
                table: "PrivateMessages");

            migrationBuilder.DropColumn(
                name: "GroupMessageMessageId",
                table: "AspNetUsers");
        }
    }
}
