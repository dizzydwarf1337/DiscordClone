using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordClone.Migrations
{
    /// <inheritdoc />
    public partial class reactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PrivateMessageMessageId",
                table: "Reactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reactions_PrivateMessageMessageId",
                table: "Reactions",
                column: "PrivateMessageMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reactions_PrivateMessages_PrivateMessageMessageId",
                table: "Reactions",
                column: "PrivateMessageMessageId",
                principalTable: "PrivateMessages",
                principalColumn: "MessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reactions_PrivateMessages_PrivateMessageMessageId",
                table: "Reactions");

            migrationBuilder.DropIndex(
                name: "IX_Reactions_PrivateMessageMessageId",
                table: "Reactions");

            migrationBuilder.DropColumn(
                name: "PrivateMessageMessageId",
                table: "Reactions");
        }
    }
}
