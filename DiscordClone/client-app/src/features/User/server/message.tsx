import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
export interface Attachment {
    attachmentId: string;
    url: string;
    fileType: string;
    fileName?: string; 
}

export interface Props {
    message: {
        messageId: string;
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string;
        channelId?: string;
        reactions: Array<{ userId: string; reactionType: string }>;
        attachments?: Array<{
            attachmentId: string;
            attachmentUrl: string;
            attachmentType: string;
            fileName?: string; 
        }>;
    };
    userId: string;
}

const Message = ({ message, userId }: Props) => {
    const [showReactions, setShowReactions] = useState(false);
    const [reactions, setReactions] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        setReactions(message.reactions.map((reaction) => reaction.reactionType));
        if (message.attachments && message.attachments.length > 0) {
            setAttachments(
                message.attachments.map((att) => ({
                    attachmentId: att.attachmentId,
                    url: att.attachmentUrl.startsWith('http') ? att.attachmentUrl : `http://localhost:5000${att.attachmentUrl}`,
                    fileType: att.attachmentType.toLowerCase(),
                    fileName: att.fileName || 'attachment' 
                }))
            );
        } else {
            setAttachments([]); 
        }
    }, [message]);

    const handleReactionClick = async (reaction: string) => {
        try {
            const hasReacted = reactions.includes(reaction);
            setReactions((prevReactions) =>
                hasReacted
                    ? prevReactions.filter((r) => r !== reaction)
                    : [...prevReactions, reaction]
            );
            const response = await fetch( `http://localhost:5000/api/message/reaction/${hasReacted ? "remove" : "add"}`, { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify({ MessageId: message.messageId, UserId: userId, ReactionType: reaction, }), });
            if (!response.ok) { throw new Error("Failed to update reaction"); }
            const updatedReactionsResponse = await fetch( `http://localhost:5000/api/message/${message.messageId}/reactions` );
            if (updatedReactionsResponse.ok) { const updatedReactions = await updatedReactionsResponse.json(); setReactions(updatedReactions.reactions || []); } 
            else { setReactions(message.reactions.map(r => r.reactionType));} 
        } catch (error) {
            setReactions(message.reactions.map(r => r.reactionType)); 
            console.error("Error updating reaction:", error);
        }
    };

    const isMyMessage = message.senderId === userId;

    const renderAttachment = (attachment: Attachment) => {
        const commonAttachmentStyles = { maxWidth: "350px", maxHeight: "300px", borderRadius: "4px", mt: 0.5, display: 'block' };
        const fileTypeNormalized = attachment.fileType?.toLowerCase() || 'unknown';

        if (fileTypeNormalized.startsWith("image")) {
            return <Box component="img" src={attachment.url} alt={attachment.fileName || "Attachment"} sx={commonAttachmentStyles} />;
        } else if (fileTypeNormalized.startsWith("video")) {
            return <video src={attachment.url} controls style={commonAttachmentStyles as React.CSSProperties} />;
        } else if (fileTypeNormalized === "document" || fileTypeNormalized.includes("pdf") || fileTypeNormalized.includes("text")) { 
            return ( <Box sx={{ mt: 0.5, p: 1, backgroundColor: '#292b2f', borderRadius: '4px', display: 'inline-block' }}><Typography variant="body2" sx={{ color: "#dcddde" }}><a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.fileName} style={{ color: '#0096cf', textDecoration: 'none' }}>{attachment.fileName || 'View/Download Document'}</a></Typography></Box> );
        } else { 
            return ( <Box sx={{ mt: 0.5, p: 1, backgroundColor: '#292b2f', borderRadius: '4px', display: 'inline-block' }}><Typography variant="body2" sx={{ color: "#dcddde" }}><a href={attachment.url} download={attachment.fileName} style={{ color: '#0096cf', textDecoration: 'none' }}>{attachment.fileName || 'Download File'}</a></Typography></Box> );
        }
    };
    
    return (
        <Box
            display="flex"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            sx={{
                position: "relative",
                py: "2px", 
                px: "20px", 
                width: '100%',
                boxSizing: 'border-box',
                '&:hover': {
                    backgroundColor: "rgba(4, 4, 5, 0.07)" 
                },
            }}
        >

            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, maxWidth: '100%' }}> 
                <Box display="flex" alignItems="baseline" gap="8px">
                    <Typography
                        variant="body1" 
                        sx={{
                            fontWeight: "500", 
                            color: "#f2f3f5", 
                            lineHeight: '1.375rem',
                            '&:hover': {
                                textDecoration: 'underline',
                                cursor: 'pointer'
                            }
                        }}
                    >
                        {message.senderName}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "#949ba4", 
                            fontSize: "0.75rem", 
                            lineHeight: '1.375rem',
                        }}
                    >
                        {new Date(message.createdAt).toLocaleString([], { 
                            year: 'numeric', 
                            month: 'numeric', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: true 
                        })}
                    </Typography>
                </Box>
                <Box sx={{ pt: "1px" }}>
                    <Typography
                        variant="body1"
                        sx={{
                            color: "#dbdee1", 
                            wordBreak: "break-word",
                            whiteSpace: "pre-line",
                            fontSize: '0.9375rem', 
                            lineHeight: '1.375rem'
                        }}
                    >
                        {message.content}
                    </Typography>
                </Box>

                {attachments && attachments.length > 0 && (
                    <Box sx={{ mt: '4px', maxWidth: '500px' }}>
                        {attachments.map((attachment) => (
                            <Box key={attachment.attachmentId} sx={{ mb: '4px' }}>{renderAttachment(attachment)}</Box>
                        ))}
                    </Box>
                )}

                {reactions && reactions.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: 'center', flexWrap: 'wrap', gap: "4px", mt: "4px" }}>
                        {reactions.map((reactionEmoji, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex', alignItems: 'center',
                                    bgcolor: 'rgba(88, 101, 242, 0.1)', 
                                    border: '1px solid rgba(88, 101, 242, 0.3)',
                                    borderRadius: '12px', p: '2px 6px', cursor: 'pointer',
                                    '&:hover': { borderColor: 'rgba(88, 101, 242, 0.5)', bgcolor: 'rgba(88, 101, 242, 0.15)'}
                                }}
                                onClick={() => handleReactionClick(reactionEmoji)}
                            >
                                <Typography variant="body2" sx={{ fontSize: "0.875rem", lineHeight: 1 }}>
                                    {reactionEmoji}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#b9bbbe', fontSize: '0.75rem', ml: '4px', fontWeight: 500 }}>
                                    {message.reactions.filter(r => r.reactionType === reactionEmoji).length || 1}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {showReactions && (
                <Box
                    display="flex" position="absolute" top="-20px" right="20px" 
                    bgcolor="#1e1f22" borderRadius="6px" padding="4px"
                    boxShadow="0 8px 16px rgba(0,0,0,0.24)" zIndex={10} sx={{ gap: '2px' }}
                >
                    {["😊", "👍", "❤️", "😄", "🎉", "🤔"].map(emoji => ( 
                        <IconButton
                            key={emoji} onClick={() => handleReactionClick(emoji)}
                            size="small"
                            sx={{ color: "#b9bbbe", borderRadius: '4px', p: '4px', '&:hover': { color: '#dcddde', backgroundColor: '#2b2d31'}}}
                        >
                            <Typography sx={{ fontSize: '1.125rem' }}>{emoji}</Typography>
                        </IconButton>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default Message;