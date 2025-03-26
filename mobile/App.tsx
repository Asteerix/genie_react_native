import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from 'sonner-native';
import { ProfileProvider } from "./context/ProfileContext";
import { ManagedAccountsProvider } from "./context/ManagedAccountsContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { defaultScreenOptions, modalScreenOptions } from './navigation/AnimatedNavigation';
import LoadingScreen from "./auth/screens/LoadingScreen"
import LoginScreen from "./auth/screens/LoginScreen"
import WishlistScreen from "./screens/WishlistScreen"
import SearchScreen from "./screens/SearchScreen"
import WishlistDetailScreen from "./screens/WishlistDetailScreen"
import WishlistSettingsScreen from "./screens/WishlistSettingsScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import EditWishScreen from "./screens/EditWishScreen";
import EventsScreen from "./screens/EventsScreen";
import EventDetailScreen from "./screens/EventDetailScreen";
import EventSearchScreen from "./screens/EventSearchScreen";
import EventSettingsScreen from "./screens/EventSettingsScreen";
import EventInviteFriendsScreen from "./screens/EventInviteFriendsScreen"
import AddWishScreen from "./screens/AddWishScreen";
import FriendsScreen from "./screens/FriendsScreen";
import SignupPasswordScreen from "./auth/screens/SignupPasswordScreen"
import VerifyPhoneScreen from "./auth/screens/VerifyPhoneScreen"
import ExistingUserPasswordScreen from "./auth/screens/ExistingUserPasswordScreen"
import SignupNameScreen from "./auth/screens/SignupNameScreen"
import SignupLastNameScreen from "./auth/screens/SignupLastNameScreen"
import SignupGenderScreen from "./auth/screens/SignupGenderScreen"
import SignupBirthdayScreen from "./auth/screens/SignupBirthdayScreen"
import FindFriendsScreen from "./auth/screens/FindFriendsScreen"
import ContactsSyncScreen from "./screens/ContactsSyncScreen"
import ManagedAccountsScreen from "./screens/ManagedAccountsScreen"
import ManagedAccountNameScreen from "./screens/ManagedAccountNameScreen"
import ManagedAccountLastNameScreen from "./screens/ManagedAccountLastNameScreen"
import ManagedAccountGender from "./screens/ManagedAccountGender"
import ManagedAccountBirthdayScreen from "./screens/ManagedAccountBirthdayScreen"
import ManagedAccountProfileScreen from "./screens/ManagedAccountProfileScreen"
import ManagedAccountProfileConfirmScreen from "./screens/ManagedAccountProfileConfirmScreen"
import ManagedAccountsListScreen from "./screens/ManagedAccountsListScreen"
import { 
  RequestResetScreen,
  VerifyCodeScreen,
  CreateNewPasswordScreen
} from "./auth/forgotPassword"
import { AuthProvider } from "./auth/context/AuthContext"
import { RootStackParamList } from './types/navigation';
import SignupProfileScreen from "./auth/screens/SignupProfileScreen"
import SignupProfileConfirmScreen from "./auth/screens/SignupProfileConfirmScreen"
import AvatarCreationScreen from "./auth/screens/AvatarCreationScreen"
import CustomEventTypeSelection from './components/CustomEventTypeSelection';
import MessagesScreen from "./screens/MessagesScreen";
import ChatDetailScreen from "./screens/ChatDetailScreen";
import NewMessageScreen from "./screens/NewMessageScreen";
import GroupChatSettingsScreen from "./screens/GroupChatSettingsScreen";
import EventChatScreen from "./screens/EventChatScreen";
import ProfileScreen from "./screens/ProfileScreen";
// import MyProfileScreen from "./screens/MyProfileScreen";
import StoryViewer from "./screens/StoryViewer";
import StoryCamera from "./screens/StoryCamera";
import StoryEditor from "./screens/StoryEditor";
import SettingsScreen from "./screens/SettingsScreen";
import SecurityScreen from "./screens/SecurityScreen";
import PasswordSecurityScreen from "./screens/PasswordSecurityScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import DeleteAccountScreen from "./screens/DeleteAccountScreen";
import ChooseAmountScreen from "./screens/ChooseAmountScreen";
import PaymentMethodScreen from "./screens/PaymentMethodScreen";
import PaymentConfirmationScreen from "./screens/PaymentConfirmationScreen";
import BankAccountsScreen from "./screens/BankAccountsScreen";
import BankAccountDetailScreen from "./screens/BankAccountDetailScreen";
import BankTransferScreen from "./screens/BankTransferScreen";
import EventSelectorScreen from "./screens/EventSelectorScreen";
import EventPotSelectorScreen from "./screens/EventPotSelectorScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Ignorer les logs non critiques pendant le développement
LogBox.ignoreLogs(['Reanimated 2']);

function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{
        ...defaultScreenOptions,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Écrans d'authentification */}
      <Stack.Screen name="Loading" component={LoadingScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="ForgotPassword" component={RequestResetScreen}/>
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen}/>
      <Stack.Screen name="CreateNewPassword" component={CreateNewPasswordScreen}/>
      <Stack.Screen name="SignupPassword" component={SignupPasswordScreen}/>
      <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen}/>
      <Stack.Screen name="ExistingUserPassword" component={ExistingUserPasswordScreen}/>
      
      {/* Écrans d'inscription */}
      <Stack.Screen name="SignupName" component={SignupNameScreen}/>
      <Stack.Screen name="SignupLastName" component={SignupLastNameScreen}/>
      <Stack.Screen name="SignupGender" component={SignupGenderScreen}/>
      <Stack.Screen name="SignupBirthday" component={SignupBirthdayScreen}/>
      <Stack.Screen name="SignupProfile" component={SignupProfileScreen}/>
      <Stack.Screen name="SignupProfileConfirm" component={SignupProfileConfirmScreen}/>
      <Stack.Screen name="AvatarCreation" component={AvatarCreationScreen}/>
      <Stack.Screen name="FindFriends" component={FindFriendsScreen}/>
      
      {/* Écrans principaux */}
     <Stack.Screen name="ContactsSync" component={ContactsSyncScreen}/>
      
      {/* Écrans de comptes gérés */}
      <Stack.Screen name="ManagedAccounts" component={ManagedAccountsScreen}/>
      <Stack.Screen name="ManagedAccountName" component={ManagedAccountNameScreen}/>
      <Stack.Screen name="ManagedAccountLastName" component={ManagedAccountLastNameScreen}/>
      <Stack.Screen name="ManagedAccountGender" component={ManagedAccountGender}/>
      <Stack.Screen name="ManagedAccountBirthday" component={ManagedAccountBirthdayScreen}/>
      <Stack.Screen name="ManagedAccountProfile" component={ManagedAccountProfileScreen}/>
      <Stack.Screen name="ManagedAccountProfileConfirm" component={ManagedAccountProfileConfirmScreen}/>
      <Stack.Screen name="ManagedAccountsList" component={ManagedAccountsListScreen}/>
      
      {/* Écrans de vœux */}
      <Stack.Screen name="Wishlist" component={WishlistScreen}/>
      <Stack.Screen name="Search" component={SearchScreen}/>
      <Stack.Screen name="WishlistDetail" component={WishlistDetailScreen}/>
      <Stack.Screen
        name="WishlistSettings"
        component={WishlistSettingsScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="EditWish" component={EditWishScreen} />
      <Stack.Screen name="AddWish" component={AddWishScreen} />
      
      {/* Écrans d'événements */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EventSearch" component={EventSearchScreen} />
      <Stack.Screen
        name="EventSettings"
        component={EventSettingsScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="EventInviteFriends" component={EventInviteFriendsScreen} />
      <Stack.Screen
        name="CustomEventTypeSelection"
        component={CustomEventTypeSelection}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
      
      {/* Écran des amis */}
      <Stack.Screen name="Friends" component={FriendsScreen} />
      
      {/* Écrans de profil */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      {/* <Stack.Screen name="MyProfile" component={MyProfileScreen} /> */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PasswordSecurity" component={PasswordSecurityScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      
      {/* Écrans de messagerie */}
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} />
      <Stack.Screen name="GroupChatSettings" component={GroupChatSettingsScreen} />
      <Stack.Screen name="EventChat" component={EventChatScreen} />
      
      {/* Écrans de story */}
      <Stack.Screen
        name="StoryViewer"
        component={StoryViewer}
        options={{
          headerShown: false,
          animation: 'fade',
          presentation: 'transparentModal'
        }}
      />
      <Stack.Screen
        name="StoryCamera"
        component={StoryCamera}
        options={{
          headerShown: false,
          animation: 'fade'
        }}
      />
      <Stack.Screen
        name="StoryEditor"
        component={StoryEditor}
        options={{
          headerShown: false,
          animation: 'fade'
        }}
      />
      
      {/* Écrans de paiement */}
      <Stack.Screen
        name="ChooseAmount"
        component={ChooseAmountScreen}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="PaymentMethod"
        component={PaymentMethodScreen}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="PaymentConfirmation"
        component={PaymentConfirmationScreen}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      
      {/* Écrans de comptes bancaires */}
      <Stack.Screen
        name="BankAccounts"
        component={BankAccountsScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="BankAccountDetail"
        component={BankAccountDetailScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="BankTransfer"
        component={BankTransferScreen}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="EventSelector"
        component={EventSelectorScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="EventPotSelector"
        component={EventPotSelectorScreen}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider style={styles.container}>
        <AuthProvider>
          <ProfileProvider>
            <ManagedAccountsProvider>
              <Toaster position="top-center" />
              <NavigationContainer>
                <RootStack />
              </NavigationContainer>
            </ManagedAccountsProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
  
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
