import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.bgMain,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarActiveTintColor: COLORS.accentPrimary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarLabelStyle: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase',
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Function',
          tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Analyze',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stability"
        options={{
          title: 'Stability',
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
