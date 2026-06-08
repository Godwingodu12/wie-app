import { Image, View } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import icons from '@/constants/icons';
import { getImageSource } from '@/utils/imageUtils';
import { useUser } from '@/context/UserContext'; 

const TabIcon = ({ focused, icon }: { focused: boolean, icon: any }) => (
    <View className='mt-2 flex flex-col items-center justify-center'>
        <Image 
            source={icon} 
            tintColor={focused ? '#ffffff' : '#6F7680'} 
            resizeMode='contain' 
            style={{ width: 28, height: 28 }} 
        />
    </View>
)

const Layout = () => {
    const { user } = useUser();
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: 'black',
                    position: 'absolute',
                    borderTopColor: '#000000',
                    borderTopWidth: .5,
                    minHeight: 70
                }
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.home} focused={focused} />
                    )
                }}
            />

            <Tabs.Screen
                name='explore'
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.explore} focused={focused} />
                    )
                }}
            />

            <Tabs.Screen
                name='connection'
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        // Prevent the default tab selection behavior
                        e.preventDefault();
                        // Push the connection flow screen directly
                        navigation.navigate('(protected)/(connection)/DetailsScreen');
                    },
                })}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.connection} focused={focused} />
                    )
                }}
            />

            <Tabs.Screen
                name='events'
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.events} focused={focused} />
                    )
                }}
            />

            <Tabs.Screen
                name='profile'
                options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <Image
                            className={`w-[28px] h-[28px] rounded-full ${focused ? 'border-[2px] border-[#fff]' : 'border-transparent'}`}
                            source={getImageSource(user.profile_picture)}
                        />
                    )
                }}
            />
        </Tabs>
    )
}

export default Layout
