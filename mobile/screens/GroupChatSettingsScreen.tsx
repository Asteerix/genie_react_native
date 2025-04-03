import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  SafeAreaView,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useMessaging } from '../context/MessagingContext';
import { useAuth } from '../auth/context/AuthContext';

type GroupChatSettingsRouteProp = RouteProp<RootStackParamList, 'GroupChatSettings'>;

interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
}

const GroupChatSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GroupChatSettingsRouteProp>();
  const { groupId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [originalGroupName, setOriginalGroupName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [muted, setMuted] = useState(false);
  
  const { getChat, updateChat } = useMessaging();
  const { user } = useAuth();
  
  useEffect(() => {
    // Fetch group chat data
    const loadGroupData = async () => {
      try {
        const chatData = await getChat(groupId);
        
        if (chatData) {
          // Set group name
          setGroupName(chatData.name || 'Group Chat');
          setOriginalGroupName(chatData.name || 'Group Chat');
          
          // Convert participants to member format
          // In a real implementation, you would fetch the user data for each participant
          const groupMembers: Member[] = [
            // Add current user first
            {
              id: user?.id || 'me',
              name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Moi',
              username: user?.username || 'user',
              avatar: user?.avatarUrl || 'https://api.a0.dev/assets/image?text=avatar%20profile%20portrait&aspect=1:1',
              isAdmin: chatData.createdBy === user?.id, // Current user is admin if they created the chat
            }
          ];
          
          // Add other participants
          // In a real implementation, you would fetch the participant details
          // For now, just create placeholder members with generated avatars
          if (chatData.participants && chatData.participants.length > 0) {
            chatData.participants.forEach((participantId, index) => {
              // Skip current user as they're already added
              if (participantId !== user?.id) {
                groupMembers.push({
                  id: participantId,
                  name: `Participant ${index + 1}`,
                  username: `user${index + 1}`,
                  avatar: `https://api.a0.dev/assets/image?text=Member&aspect=1:1&seed=${100 + index}`,
                  isAdmin: participantId === chatData.createdBy,
                });
              }
            });
          }
          
          setMembers(groupMembers);
        } else {
          // Chat not found, show error and navigate back
          Alert.alert('Error', 'Group chat not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading group chat:', error);
        Alert.alert('Error', 'Failed to load group chat');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroupData();
  }, [groupId, user]);

  const handleBackPress = async () => {
    // Check if group name has changed
    if (groupName !== originalGroupName) {
      try {
        // Save the changes to the backend
        await updateChat(groupId, groupName);
      } catch (error) {
        console.error('Error updating chat name:', error);
        Alert.alert('Error', 'Failed to update chat name');
      }
    }
    
    navigation.goBack();
  };

  const handleAddMembers = () => {
    // In a real app, navigate to a screen to add new members
    navigation.navigate('NewMessage');
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert(
      "Retirer du groupe",
      "Êtes-vous sûr de vouloir retirer cette personne du groupe ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Retirer", 
          style: "destructive",
          onPress: () => {
            // In a real app, you would make an API call to remove member
            setMembers(prev => prev.filter(member => member.id !== memberId));
          }
        }
      ]
    );
  };

  const handleMakeAdmin = (memberId: string) => {
    setMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, isAdmin: true } 
          : member
      )
    );
  };

  const { leaveChat } = useMessaging();

  const handleLeaveGroup = () => {
    Alert.alert(
      "Quitter le groupe",
      "Êtes-vous sûr de vouloir quitter ce groupe ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Quitter", 
          style: "destructive",
          onPress: async () => {
            try {
              // Make API call to leave group
              const success = await leaveChat(groupId);
              
              if (success) {
                navigation.navigate('Messages');
              } else {
                Alert.alert('Error', 'Failed to leave group. Please try again.');
              }
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'An error occurred while leaving the group');
            }
          }
        }
      ]
    );
  };

  const toggleMute = () => {
    setMuted(!muted);
    // In a real app, you would update this setting on the backend
  };

  const saveGroupName = () => {
    if (groupName.trim() === '') {
      setGroupName(originalGroupName);
    }
    setIsEditingName(false);
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{item.name}</Text>
          {item.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      
      {item.id !== 'me' && (
        <View style={styles.memberActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleMakeAdmin(item.id)}
            disabled={item.isAdmin}
          >
            <Ionicons 
              name="star-outline"
              size={24} 
              color={item.isAdmin ? "#CCCCCC" : "#666"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleRemoveMember(item.id)}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Chargement des paramètres du groupe...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres du groupe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Group Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.groupAvatarContainer}>
            {members.slice(0, 2).map((member, index) => (
              <Image 
                key={member.id}
                source={{ uri: member.avatar }} 
                style={[
                  styles.groupAvatar, 
                  { top: index === 0 ? 0 : null, left: index === 0 ? 0 : null, 
                    bottom: index === 1 ? 0 : null, right: index === 1 ? 0 : null }
                ]} 
              />
            ))}
          </View>
        </View>
        
        {/* Group Name */}
        <View style={styles.groupNameSection}>
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={groupName}
                onChangeText={setGroupName}
                autoFocus
                onBlur={saveGroupName}
                placeholder="Nom du groupe"
              />
              <TouchableOpacity style={styles.saveButton} onPress={saveGroupName}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.groupNameRow}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.sectionTitle}>Nom du groupe</Text>
              <View style={styles.groupNameContainer}>
                <Text style={styles.groupName}>{groupName}</Text>
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Members Section */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Membres</Text>
            <Text style={styles.membersCount}>{members.length}</Text>
          </View>
          
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
          
          <TouchableOpacity 
            style={styles.addMemberButton}
            onPress={handleAddMembers}
          >
            <Ionicons name="person-add-outline" size={24} color="#007AFF" />
            <Text style={styles.addMemberText}>Ajouter des membres</Text>
          </TouchableOpacity>
        </View>
        
        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-off-outline" size={24} color="#333" />
              <Text style={styles.settingText}>Mettre en sourdine</Text>
            </View>
            <Switch
              value={muted}
              onValueChange={toggleMute}
              trackColor={{ false: '#DDDDDD', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* Leave Group */}
        <TouchableOpacity 
          style={styles.leaveGroupButton}
          onPress={handleLeaveGroup}
        >
          <Ionicons name="exit-outline" size={24} color="#FF3B30" />
          <Text style={styles.leaveGroupText}>Quitter le groupe</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  groupAvatarContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    backgroundColor: '#F0F0F0',
    borderRadius: 50,
  },
  groupAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  groupNameSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  groupNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 16,
    marginRight: 10,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
  },
  saveButton: {
    marginLeft: 10,
    padding: 10,
  },
  saveButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  membersSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  membersCount: {
    fontSize: 16,
    color: '#999',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  memberActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
  },
  addMemberText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  settingsSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  leaveGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 15,
  },
  leaveGroupText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default GroupChatSettingsScreen;