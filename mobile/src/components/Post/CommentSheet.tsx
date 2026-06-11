import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, TextInput, FlatList, Image, Platform, ActivityIndicator, Dimensions, KeyboardAvoidingView, Keyboard } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { mediaService } from '@/services/mediaService';
import { getImageSource } from '@/utils/imageUtils';
import { useUser } from '@/context/UserContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CommentSheetProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
}

interface Comment {
  _id: string;
  userId: string;
  username: string;
  name: string;
  profile_picture?: string;
  text: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  hasLiked?: boolean;
}

const CommentSheet = ({ isVisible, onClose, postId }: CommentSheetProps) => {
    const { user } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isVisible) {
            fetchComments();
        }
    }, [isVisible]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await mediaService.getPostComments(postId);
            if (response.success) {
                setComments(response.comments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        
        setSubmitting(true);
        try {
            const response = await mediaService.addComment(postId, commentText);
            if (response.success) {
                // Enrich the comment with user data for immediate UI update
                const newComment = {
                    ...response.comment,
                    username: user?.username || 'me',
                    profile_picture: user?.profile_picture
                };
                setComments(prev => [newComment, ...prev]);
                setCommentText('');
                Keyboard.dismiss();
            }
        } catch (error: any) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
        
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View className="mb-6">
            <View className="flex-row px-4">
                <Image 
                    source={getImageSource(item.profile_picture)} 
                    style={{ width: 34, height: 34, borderRadius: 17 }}
                    className="bg-neutral-800"
                />
                <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                        <Text className="text-white text-[13px] font-semibold">@{item.username}</Text>
                        <Text className="text-gray-500 text-[12px] ml-2">{formatTime(item.createdAt)}</Text>
                    </View>
                    <Text className="text-white text-[14px] mt-1 leading-[20px]">
                        {item.text}
                    </Text>
                    <View className="flex-row items-center mt-2">
                        <TouchableOpacity className="flex-row items-center">
                            <Ionicons name="heart-outline" size={16} color="#8E8E93" />
                            <Text className="text-gray-500 text-[12px] ml-1.5">{item.likeCount || 666}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="ml-6">
                            <Text className="text-gray-500 text-[12px] font-bold">Replay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="ml-6">
                            <Text className="text-gray-500 text-[12px] font-bold">See translation</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity className="justify-start pt-1 px-1">
                    <MaterialCommunityIcons name="heart-multiple" size={18} color="#7C4DFF" />
                </TouchableOpacity>
            </View>

            {/* Reply Thread Line & Label */}
            {(item.replyCount > 0 || Math.random() > 0.5) && ( // Random for demo if count is 0
                <View className="flex-row items-center ml-[52px] mt-3">
                    <View 
                        style={{ 
                            width: 30, 
                            height: 20, 
                            borderLeftWidth: 1, 
                            borderBottomWidth: 1, 
                            borderColor: '#3A3A3C',
                            borderBottomLeftRadius: 10,
                            position: 'absolute',
                            left: -20,
                            top: -20
                        }} 
                    />
                    <TouchableOpacity className="flex-row items-center">
                        <Text className="text-gray-500 text-[12px] font-bold">
                            {item.replyCount || 230} replies
                        </Text>
                        <Ionicons name="chevron-forward" size={12} color="#8E8E93" className="ml-1" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1 bg-black/60">
                <Pressable className="absolute inset-0" onPress={onClose} />
                
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    <View className="flex-1 justify-end">
                        <View 
                            className="bg-[#121212] rounded-t-[36px] overflow-hidden"
                            style={{ marginTop: SCREEN_HEIGHT * 0.15 }}
                        >
                            {/* Top Handle */}
                            <View className="w-10 h-1 bg-white/30 self-center rounded-full mt-3 mb-1" />

                            {/* Header */}
                            <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/5">
                                <View className="w-6" />
                                <Text className="text-white text-[17px] font-bold">Comments</Text>
                                <TouchableOpacity onPress={onClose} hitSlop={12}>
                                    <Ionicons name="close" size={28} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* Comments List */}
                            <View style={{ height: SCREEN_HEIGHT * 0.85 - 160 }}>
                                {loading && comments.length === 0 ? (
                                    <View className="flex-1 justify-center items-center">
                                        <ActivityIndicator color="#7C4DFF" />
                                    </View>
                                ) : (
                                    <FlatList 
                                        data={comments}
                                        keyExtractor={(item, index) => item._id || index.toString()}
                                        renderItem={renderComment}
                                        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                        ListEmptyComponent={
                                            !loading ? (
                                                <View className="mt-20 items-center">
                                                    <Ionicons name="chatbubble-ellipses-outline" size={60} color="#3A3A3C" />
                                                    <Text className="text-gray-500 mt-4 text-lg">No comments yet</Text>
                                                    <Text className="text-gray-600 mt-1">Be the first to share your thoughts!</Text>
                                                </View>
                                            ) : null
                                        }
                                    />
                                )}
                            </View>

                            {/* Footer Input */}
                            <View className="bg-[#121212] px-4 pt-3 pb-8 border-t border-white/5">
                                <View className="flex-row items-center bg-[#1C1C1E] rounded-full px-4 py-2 border border-white/10">
                                    <TouchableOpacity className="mr-3">
                                        <Ionicons name="happy-outline" size={24} color="white" />
                                    </TouchableOpacity>
                                    <TextInput 
                                        ref={inputRef}
                                        placeholder="Add Comment" 
                                        placeholderTextColor="#8E8E93" 
                                        className="flex-1 text-white text-[15px] py-2"
                                        selectionColor="#7C4DFF"
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        multiline
                                    />
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#7C4DFF" className="ml-2" />
                                    ) : (
                                        <TouchableOpacity 
                                            onPress={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="ml-2"
                                        >
                                            <Ionicons 
                                                name="paper-plane" 
                                                size={22} 
                                                color={commentText.trim() ? "#7C4DFF" : "#3A3A3C"} 
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default CommentSheet;
