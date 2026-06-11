import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, TextInput, FlatList, Image, Platform, Share, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getSuggestedUsers, searchUsers } from '@/services/wieUserService';
import { sharePost } from '@/services/mediaService';
import { getImageSource } from '@/utils/imageUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  profile_picture?: string;
}

const ACTION_OPTIONS = [
    { id: 'story', name: 'Add to story', icon: 'camera-outline', type: 'ionicons' },
    { id: 'link', name: 'Share link', icon: 'link-variant', type: 'material' },
    { id: 'share', name: 'Share', icon: 'share-variant', type: 'material' },
    { id: 'whatsapp', name: 'Whatsapp', icon: 'whatsapp', type: 'material', color: '#25D366' },
];

const ShareSheet = ({ isVisible, onClose, postId }: ShareSheetProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isVisible) {
            fetchUsers();
            setSelectedUsers([]);
            setSearchQuery('');
        }
    }, [isVisible]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getSuggestedUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            setLoading(true);
            try {
                const data = await searchUsers(query);
                setUsers(data);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        } else if (query.length === 0) {
            fetchUsers();
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleExternalAction = async (optionId: string) => {
        const shareUrl = `https://wie.app/post/${postId}`;
        try {
            if (optionId === 'link') {
                await Share.share({ message: shareUrl });
            } else {
                await Share.share({
                    message: `Check out this post on Wie: ${shareUrl}`,
                    url: shareUrl,
                });
            }
        } catch (error: any) {
            console.error('Error sharing:', error.message);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                
                <View 
                    style={{ 
                        backgroundColor: '#1C1C1E', 
                        height: SCREEN_HEIGHT * 0.72, 
                        borderTopLeftRadius: 36, 
                        borderTopRightRadius: 36,
                        overflow: 'hidden',
                    }}
                >
                    {/* Top Handle */}
                    <View style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', borderRadius: 2, marginTop: 12 }} />

                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12 }}>
                        <View style={{ width: 32 }} />
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Share</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={12}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 12, height: 44 }}>
                            <Ionicons name="search" size={20} color="#8E8E93" />
                            <TextInput 
                                placeholder="Search" 
                                placeholderTextColor="#8E8E93" 
                                style={{ marginLeft: 10, flex: 1, color: 'white', fontSize: 16 }}
                                selectionColor="#8B5CF6"
                                value={searchQuery}
                                onChangeText={handleSearch}
                            />
                        </View>
                        <TouchableOpacity 
                            activeOpacity={0.7}
                            style={{ marginLeft: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MaterialCommunityIcons name="account-plus-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Users Grid */}
                    {loading && users.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator color="#8B5CF6" />
                        </View>
                    ) : (
                        <FlatList 
                            data={users}
                            numColumns={3}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 150 }}
                            renderItem={({ item }) => {
                                const isSelected = selectedUsers.includes(item.id);
                                return (
                                    <TouchableOpacity 
                                        activeOpacity={0.7} 
                                        style={{ alignItems: 'center', flex: 1, marginBottom: 25 }}
                                        onPress={() => toggleUserSelection(item.id)}
                                    >
                                        <View style={{ position: 'relative' }}>
                                            <Image 
                                                source={getImageSource(item.profile_picture)} 
                                                style={{ width: 80, height: 84, borderRadius: 42, backgroundColor: '#262626' }}
                                            />
                                            {isSelected && (
                                                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 10, padding: 1, borderWidth: 1.5, borderColor: '#1C1C1E' }}>
                                                    <Ionicons name="checkmark" size={14} color="black" />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ color: 'white', fontSize: 11, marginTop: 8, textAlign: 'center' }} numberOfLines={1}>
                                            {item.username || item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                !loading ? (
                                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                                        <Text style={{ color: '#666' }}>No users found</Text>
                                    </View>
                                ) : null
                            }
                        />
                    )}

                    {/* Bottom Action Row (Horizontal Scroll) */}
                    <View 
                        style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            backgroundColor: '#1C1C1E', 
                            paddingTop: 15, 
                            paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                            borderTopWidth: 0.5,
                            borderTopColor: 'rgba(255,255,255,0.1)'
                        }}
                    >
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                        >
                            {ACTION_OPTIONS.map((option) => (
                                <TouchableOpacity 
                                    key={option.id} 
                                    activeOpacity={0.7} 
                                    style={{ alignItems: 'center', marginRight: 25 }}
                                    onPress={() => handleExternalAction(option.id)}
                                >
                                    <View 
                                        style={{ 
                                            width: 54, 
                                            height: 54, 
                                            borderRadius: 27, 
                                            backgroundColor: '#2C2C2E', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            marginBottom: 8 
                                        }}
                                    >
                                        {option.type === 'ionicons' ? (
                                            <Ionicons name={option.icon as any} size={26} color="white" />
                                        ) : (
                                            <MaterialCommunityIcons name={option.icon as any} size={28} color={option.color || "white"} />
                                        )}
                                    </View>
                                    <Text style={{ color: 'white', fontSize: 11 }}>{option.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ShareSheet;
