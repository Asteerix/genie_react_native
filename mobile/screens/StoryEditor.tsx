import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  PanResponder,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  BackHandler,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
// import { SharedElement } from 'react-navigation-shared-element'; // Commented out due to build errors
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigation';

// Constants and types
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type StoryEditorRouteProps = RouteProp<RootStackParamList, 'StoryEditor'>;

type ToolType = 'draw' | 'text' | 'sticker' | 'filter' | null;

type Point = { x: number; y: number };
type DrawPath = { 
  points: Point[]; 
  color: string; 
  width: number; 
  id: string; 
  opacity: number;
};

type StickerItem = {
  id: string;
  x: number;
  y: number;
  content: string;
  type: 'emoji' | 'text';
  style?: any;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

type FilterOption = {
  id: string;
  name: string;
  filter: string;
  intensity: number;
};

// Color palette - Instagram-like
const DRAWING_COLORS = [
  '#FFFFFF', '#E1306C', '#F77737', '#FCAF45', 
  '#FFDC80', '#8A3AB9', '#4C68D7', '#CD486B', 
  '#FBAD50', '#BC2A8D', '#000000'
];

const EMOJI_PACKS = {
  recent: ['😀', '😍', '🔥', '👍', '❤️', '✨'],
  emotions: ['😀', '😂', '😍', '🥰', '😎', '🤩', '😊', '🥺', '😇', '🙄', '😴', '🥳'],
  nature: ['🌟', '🌈', '💐', '🌸', '🌹', '🌻', '🌴', '🌵', '🍀', '🍂', '🍁', '🌊'],
  objects: ['💯', '💥', '💫', '💡', '💎', '🎁', '🏆', '📱', '💻', '📸', '🔍', '⚽']
};

const TEXT_STYLES = [
  { fontFamily: 'Arial', fontWeight: 'normal' as const, fontStyle: 'normal' as const, color: '#FFFFFF', fontSize: 28, textShadowRadius: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 } },
  { fontFamily: 'Arial', fontWeight: 'bold' as const, fontStyle: 'normal' as const, color: '#FFFFFF', fontSize: 28, textShadowRadius: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 } },
  { fontFamily: 'Georgia', fontWeight: 'normal' as const, fontStyle: 'italic' as const, color: '#FFFFFF', fontSize: 28, textShadowRadius: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 } },
  { fontFamily: 'Courier', fontWeight: 'bold' as const, fontStyle: 'normal' as const, color: '#E1306C', fontSize: 28, textShadowRadius: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 } },
  { fontFamily: 'Arial', fontWeight: 'normal' as const, fontStyle: 'normal' as const, color: '#000000', fontSize: 28, textShadowRadius: 3, textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 1, height: 1 } },
  { fontFamily: 'Verdana', fontWeight: 'bold' as const, fontStyle: 'normal' as const, color: '#FCAF45', fontSize: 28, textShadowRadius: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 } },
];

const FILTERS = [
  { id: 'original', name: 'Original', filter: '', intensity: 1 },
  { id: 'clarendon', name: 'Clarendon', filter: 'saturate(1.3) contrast(1.2) brightness(1.1)', intensity: 1 },
  { id: 'gingham', name: 'Gingham', filter: 'sepia(0.2) brightness(1.1)', intensity: 1 },
  { id: 'moon', name: 'Moon', filter: 'grayscale(1) brightness(1.1) contrast(1.1)', intensity: 1 },
  { id: 'lark', name: 'Lark', filter: 'sepia(0.1) brightness(1.2)', intensity: 1 },
  { id: 'reyes', name: 'Reyes', filter: 'sepia(0.3) contrast(0.9) brightness(1.1)', intensity: 1 },
  { id: 'juno', name: 'Juno', filter: 'saturate(1.4) contrast(1.1)', intensity: 1 },
  { id: 'slumber', name: 'Slumber', filter: 'sepia(0.4) saturate(0.8)', intensity: 1 },
  { id: 'crema', name: 'Crema', filter: 'sepia(0.2) contrast(1.1) brightness(1.1)', intensity: 1 },
];

/**
 * Main Story Editor Component
 */
const StoryEditor: React.FC = () => {
  // Navigation and route
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<StoryEditorRouteProps>();
  const { mediaUri } = route.params;
  const insets = useSafeAreaInsets();
  
  // Refs
  const viewShotRef = useRef<ViewShot>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const currentPosRef = useRef({ x: 0, y: 0 });
  const isSavingRef = useRef(false);
  
  // Animation values
  const toolbarAnimation = useRef(new Animated.Value(1)).current;
  const toolPanelAnimation = useRef(new Animated.Value(0)).current;
  const zoomAnimation = useRef(new Animated.Value(1)).current;
  const emojiPopupAnimation = useRef(new Animated.Value(0)).current;
  
  // State
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessingMsg, setShowProcessingMsg] = useState("");
  
  // Drawing states
  const [drawingColor, setDrawingColor] = useState(DRAWING_COLORS[0]);
  const [drawingWidth, setDrawingWidth] = useState(12);
  const [drawingOpacity, setDrawingOpacity] = useState(1);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [undoStack, setUndoStack] = useState<DrawPath[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[][]>([]);
  
  // Sticker states
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [currentEmojiPack, setCurrentEmojiPack] = useState<keyof typeof EMOJI_PACKS>('recent');
  const [showEmojiPackSelector, setShowEmojiPackSelector] = useState(false);
  
  // Text states
  const [inputText, setInputText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [editingStickerIndex, setEditingStickerIndex] = useState<number | null>(null);
  const [textStyle, setTextStyle] = useState(TEXT_STYLES[0]);
  
  // Filter states
  const [appliedFilter, setAppliedFilter] = useState<FilterOption>(FILTERS[0]);
  const [filterIntensity, setFilterIntensity] = useState(1);
  
  // Background control
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgColor, setBgColor] = useState('#000000');
  
  // Animation controllers
  const animateToolbar = useCallback((show: boolean) => {
    Animated.timing(toolbarAnimation, {
      toValue: show ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [toolbarAnimation]);

  const animateToolPanel = useCallback((show: boolean) => {
    Animated.timing(toolPanelAnimation, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [toolPanelAnimation]);
  
  const animateEmojiPopup = useCallback((show: boolean) => {
    Animated.timing(emojiPopupAnimation, {
      toValue: show ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [emojiPopupAnimation]);
  
  // Handle back button
  useEffect(() => {
    const handleBackButton = () => {
      if (selectedTool !== null) {
        setSelectedTool(null);
        return true;
      }
      
      if (selectedStickerId !== null) {
        setSelectedStickerId(null);
        return true;
      }
      
      if (showTextInput) {
        setShowTextInput(false);
        return true;
      }
      
      return false;
    };
    
    BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
    };
  }, [selectedTool, selectedStickerId, showTextInput]);
  
  // Handle tool selection
  useEffect(() => {
    if (selectedTool) {
      animateToolbar(false);
      animateToolPanel(true);
      Keyboard.dismiss();
    } else {
      animateToolbar(true);
      animateToolPanel(false);
      setSelectedStickerId(null);
    }
  }, [selectedTool, animateToolbar, animateToolPanel]);
  
  // Drawing functions
  
  // Efficiently serialize path for SVG
  const serializePath = useCallback((points: Point[]): string => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }, []);
  
  // Drawing handlers with optimized performance
  const handleDrawStart = useCallback((x: number, y: number) => {
    if (selectedTool !== 'draw') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isDrawingRef.current = true;
    setCurrentPath([{ x, y }]);
    lastPointRef.current = { x, y };
  }, [selectedTool]);
  
  const handleDrawMove = useCallback((x: number, y: number) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    
    // Distance-based point addition for smoother lines
    const lastPoint = lastPointRef.current;
    const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
    
    if (distance >= 2) { // Minimum distance threshold
      setCurrentPath(prev => [...prev, { x, y }]);
      lastPointRef.current = { x, y };
    }
  }, []);
  
  const handleDrawEnd = useCallback(() => {
    if (!isDrawingRef.current || currentPath.length < 2) {
      isDrawingRef.current = false;
      setCurrentPath([]);
      lastPointRef.current = null;
      return;
    }
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add current path to paths array
    const newPath: DrawPath = {
      points: currentPath,
      color: drawingColor,
      width: drawingWidth,
      opacity: drawingOpacity,
      id: `path-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, [...paths]]);
    setRedoStack([]); // Clear redo stack on new drawing
    
    // Update paths
    setPaths(prev => [...prev, newPath]);
    
    // Reset current path
    isDrawingRef.current = false;
    setCurrentPath([]);
    lastPointRef.current = null;
  }, [currentPath, drawingColor, drawingWidth, drawingOpacity, paths]);
  
  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (paths.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save current state to redo stack
    setRedoStack(prev => [...prev, [...paths]]);
    
    // Restore previous state
    if (undoStack.length > 0) {
      const prevState = undoStack[undoStack.length - 1];
      setPaths(prevState);
      setUndoStack(prev => prev.slice(0, -1));
    } else {
      setPaths([]);
    }
  }, [paths, undoStack]);
  
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Get next state from redo stack
    const nextState = redoStack[redoStack.length - 1];
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, [...paths]]);
    
    // Restore next state
    setPaths(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  }, [paths, redoStack]);
  
  const handleClearDrawing = useCallback(() => {
    Alert.alert(
      "Clear Drawing",
      "Are you sure you want to clear all your drawings?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: () => {
            if (paths.length === 0) return;
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Save current state to undo stack
            setUndoStack(prev => [...prev, [...paths]]);
            setRedoStack([]);
            setPaths([]);
          }
        }
      ]
    );
  }, [paths]);
  
  // Sticker management
  const addSticker = useCallback((content: string, type: 'emoji' | 'text') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Calculate center position
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: centerX,
      y: centerY,
      content,
      type,
      scale: 1,
      rotation: 0,
      opacity: 1,
      zIndex: stickers.length + 1,
      ...(type === 'text' ? { style: textStyle } : {})
    };
    
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setShowTextInput(false);
    
    // Close emoji selector if open
    if (showEmojiPackSelector) {
      setShowEmojiPackSelector(false);
      animateEmojiPopup(false);
    }
  }, [textStyle, stickers.length, showEmojiPackSelector, animateEmojiPopup]);
  
  const updateStickerPosition = useCallback((id: string, x: number, y: number) => {
    setStickers(prev => 
      prev.map(sticker => 
        sticker.id === id ? { ...sticker, x, y } : sticker
      )
    );
  }, []);
  
  const updateStickerTransform = useCallback((id: string, scale: number, rotation: number) => {
    setStickers(prev => 
      prev.map(sticker => 
        sticker.id === id ? { ...sticker, scale, rotation } : sticker
      )
    );
  }, []);
  
  const updateStickerZIndex = useCallback((id: string) => {
    setStickers(prev => {
      const maxZIndex = Math.max(...prev.map(s => s.zIndex), 0);
      return prev.map(sticker => 
        sticker.id === id ? { ...sticker, zIndex: maxZIndex + 1 } : sticker
      );
    });
  }, []);
  
  const deleteSticker = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
    setSelectedStickerId(null);
  }, []);
  
  const editTextSticker = useCallback((sticker: StickerItem) => {
    const index = stickers.findIndex(s => s.id === sticker.id);
    if (index !== -1) {
      setInputText(sticker.content);
      setEditingStickerIndex(index);
      setTextStyle(sticker.style || TEXT_STYLES[0]);
      setShowTextInput(true);
    }
  }, [stickers]);
  
  const saveTextSticker = useCallback(() => {
    if (!inputText.trim()) {
      setShowTextInput(false);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (editingStickerIndex !== null) {
      setStickers(prev => {
        const newStickers = [...prev];
        newStickers[editingStickerIndex] = {
          ...newStickers[editingStickerIndex],
          content: inputText,
          style: textStyle
        };
        return newStickers;
      });
    } else {
      addSticker(inputText, 'text');
    }
    
    setInputText('');
    setEditingStickerIndex(null);
    setShowTextInput(false);
  }, [inputText, editingStickerIndex, textStyle, addSticker]);
  
  // Create pan responders for stickers - much more responsive
  const createStickerPanResponder = useCallback((stickerId: string) => {
    const stickerRef = {
      initialX: 0,
      initialY: 0,
      initialTouchDistance: 0,
      initialRotation: 0,
      currentScale: 1,
      currentRotation: 0,
      isMultiTouch: false,
      lastTapTime: 0
    };
    
    const foundSticker = stickers.find(s => s.id === stickerId);
    if (foundSticker) {
      stickerRef.currentScale = foundSticker.scale;
      stickerRef.currentRotation = foundSticker.rotation;
    }
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to movements if they're significant
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      
      onPanResponderGrant: (evt, gestureState) => {
        // Double tap detection for text editing
        const now = Date.now();
        const tappedSticker = stickers.find(s => s.id === stickerId);
        
        if (tappedSticker && tappedSticker.type === 'text' && now - stickerRef.lastTapTime < 300) {
          editTextSticker(tappedSticker);
          return;
        }
        
        stickerRef.lastTapTime = now;
        
        // Select sticker and bring to front
        setSelectedStickerId(stickerId);
        updateStickerZIndex(stickerId);
        
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        const { pageX, pageY } = evt.nativeEvent;
        const sticker = stickers.find(s => s.id === stickerId);
        
        if (sticker) {
          stickerRef.initialX = sticker.x;
          stickerRef.initialY = sticker.y;
        }
        
        const touches = evt.nativeEvent.touches;
        stickerRef.isMultiTouch = touches.length > 1;
        
        if (stickerRef.isMultiTouch && touches.length === 2) {
          // Calculate initial distance and rotation for pinch/rotate
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          stickerRef.initialTouchDistance = Math.sqrt(dx * dx + dy * dy);
          stickerRef.initialRotation = Math.atan2(dy, dx) * (180 / Math.PI);
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        const isMultiTouch = touches.length > 1;
        
        if (isMultiTouch && touches.length === 2) {
          // Handle pinch and rotation
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Calculate scale change
          const scale = stickerRef.currentScale * (distance / stickerRef.initialTouchDistance);
          const newScale = Math.max(0.5, Math.min(3, scale)); // Limit scale between 0.5 and 3
          
          // Calculate rotation change
          const rotationDelta = rotation - stickerRef.initialRotation;
          const newRotation = (stickerRef.currentRotation + rotationDelta) % 360;
          
          updateStickerTransform(stickerId, newScale, newRotation);
        } else {
          // Handle drag
                      if (stickerRef.isMultiTouch && touches.length < 2) {
            // If we went from multitouch to single touch, update references
            stickerRef.isMultiTouch = false;
            const currentSticker = stickers.find(s => s.id === stickerId);
            if (currentSticker) {
              stickerRef.initialX = currentSticker.x;
              stickerRef.initialY = currentSticker.y;
              stickerRef.currentScale = currentSticker.scale;
              stickerRef.currentRotation = currentSticker.rotation;
            }
            // Reset gestureState deltas to prevent jumps
            gestureState.dx = 0;
            gestureState.dy = 0;
          } else {
            const newX = stickerRef.initialX + gestureState.dx;
            const newY = stickerRef.initialY + gestureState.dy;
            updateStickerPosition(stickerId, newX, newY);
          }
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const releasedSticker = stickers.find(s => s.id === stickerId);
        if (releasedSticker) {
          stickerRef.currentScale = releasedSticker.scale;
          stickerRef.currentRotation = releasedSticker.rotation;
        }
        stickerRef.isMultiTouch = false;
      }
    });
  }, [stickers, updateStickerPosition, updateStickerTransform, updateStickerZIndex, editTextSticker]);
  
  // Image capture and save functions
  const captureAndSaveImage = useCallback(async () => {
    if (isSavingRef.current || !viewShotRef.current) return;
    
    try {
      isSavingRef.current = true;
      
      setIsProcessing(true);
      setShowProcessingMsg("Saving your story...");
      
      // Hide UI elements for capture
      setSelectedTool(null);
      setSelectedStickerId(null);
      
      // Small delay to ensure UI updates before capture
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the view
      if (!viewShotRef.current) { // Check if ref is available
        throw new Error("ViewShot ref is not available");
      }
      const uri = await viewShotRef.current.capture();
      
      // Check permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Cannot save image without permission to access media library.");
        setIsProcessing(false);
        isSavingRef.current = false;
        return;
      }
      
      // Process the image with the applied filter
      let finalUri = uri;
      
      if (appliedFilter.id !== 'original' && appliedFilter.filter) {
        setShowProcessingMsg("Applying filters...");
        // We would normally use a proper image processing library here
        // but for this example, just use the original image
      }
      
      // Save to media library
      await MediaLibrary.saveToLibraryAsync(finalUri);
      
      // Success message and haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setShowProcessingMsg("Story saved successfully!");
      
      // Wait a moment to show success message
      setTimeout(() => {
        setIsProcessing(false);
        isSavingRef.current = false;
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save your story. Please try again.");
      setIsProcessing(false);
      isSavingRef.current = false;
    }
  }, [navigation, appliedFilter]);
  
  // UI components with Instagram-like styling
  
  // Main toolbar with tool selection
  const renderToolbar = useMemo(() => () => (
    <Animated.View 
      style={[
        styles.toolbar, 
        { 
          opacity: toolbarAnimation,
          transform: [
            { translateY: toolbarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0]
            })}
          ],
          paddingBottom: Math.max(16, insets.bottom)
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          
          Alert.alert(
            "Discard Story?",
            "If you go back now, your edits will be lost.",
            [
              { text: "Keep Editing", style: "cancel" },
              { 
                text: "Discard", 
                style: "destructive", 
                onPress: () => navigation.goBack()
              }
            ]
          );
        }}
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>
      
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          style={[styles.toolButton, selectedTool === 'draw' && styles.toolButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTool(prev => prev === 'draw' ? null : 'draw');
          }}
        >
          <MaterialIcons name="brush" size={26} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, selectedTool === 'text' && styles.toolButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (selectedTool !== 'text') {
              setSelectedTool('text');
              setShowTextInput(true);
              setInputText('');
              setEditingStickerIndex(null);
            } else {
              setSelectedTool(null);
            }
          }}
        >
          <MaterialIcons name="text-fields" size={26} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, selectedTool === 'sticker' && styles.toolButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTool(prev => prev === 'sticker' ? null : 'sticker');
          }}
        >
          <MaterialIcons name="emoji-emotions" size={26} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, selectedTool === 'filter' && styles.toolButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTool(prev => prev === 'filter' ? null : 'filter');
          }}
        >
          <Feather name="sliders" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          captureAndSaveImage();
        }}
      >
        <LinearGradient
          colors={['#4C68D7', '#8A3AB9', '#CD486B', '#FBAD50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveButtonGradient}
        >
          <Ionicons name="arrow-forward" size={26} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  ), [toolbarAnimation, insets.bottom, selectedTool, navigation, captureAndSaveImage]);
  
  // Drawing tool panel with clear exit button
  const renderDrawingToolPanel = useMemo(() => () => (
    <Animated.View 
      style={[
        styles.toolPanel,
        {
          opacity: toolPanelAnimation,
          transform: [
            { translateY: toolPanelAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0]
            })}
          ],
          paddingBottom: Math.max(16, insets.bottom)
        }
      ]}
    >
      <View style={styles.toolPanelHeader}>
        <View style={styles.toolbarControls}>
          <TouchableOpacity 
            style={[styles.toolbarButton, paths.length === 0 && styles.toolbarButtonDisabled]}
            onPress={handleUndo}
            disabled={paths.length === 0}
          >
            <Ionicons 
              name="arrow-undo" 
              size={24} 
              color={paths.length > 0 ? "#FFF" : "rgba(255,255,255,0.4)"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, redoStack.length === 0 && styles.toolbarButtonDisabled]}
            onPress={handleRedo}
            disabled={redoStack.length === 0}
          >
            <Ionicons 
              name="arrow-redo" 
              size={24} 
              color={redoStack.length > 0 ? "#FFF" : "rgba(255,255,255,0.4)"}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.toolbarControls}>
          <TouchableOpacity 
            style={[styles.toolbarButton, paths.length === 0 && styles.toolbarButtonDisabled]}
            onPress={handleClearDrawing}
            disabled={paths.length === 0}
          >
            <MaterialIcons 
              name="delete-outline" 
              size={24} 
              color={paths.length > 0 ? "#FFF" : "rgba(255,255,255,0.4)"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelToolButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTool(null);
            }}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeToolButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTool(null);
            }}
          >
            <AntDesign name="check" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.drawingControls}>
        <View style={styles.colorPickerContainer}>
          {DRAWING_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                drawingColor === color && styles.selectedColorButton
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDrawingColor(color);
              }}
            />
          ))}
        </View>
        
        <View style={styles.sliderContainer}>
          <View style={styles.sliderLabelRow}>
            <MaterialIcons name="line-weight" size={20} color="#FFF" />
            <Text style={styles.sliderValueText}>{Math.round(drawingWidth)}</Text>
          </View>
          <Slider
            style={styles.slider}
            value={drawingWidth}
            onValueChange={setDrawingWidth}
            minimumValue={2}
            maximumValue={30}
            step={1}
            minimumTrackTintColor="#4C68D7"
            maximumTrackTintColor="#555"
            thumbTintColor="#FFF"
          />
        </View>
        
        <View style={styles.sliderContainer}>
          <View style={styles.sliderLabelRow}>
            <Feather name="droplet" size={20} color="#FFF" />
            <Text style={styles.sliderValueText}>{Math.round(drawingOpacity * 100)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            value={drawingOpacity}
            onValueChange={setDrawingOpacity}
            minimumValue={0.1}
            maximumValue={1}
            step={0.05}
            minimumTrackTintColor="#4C68D7"
            maximumTrackTintColor="#555"
            thumbTintColor="#FFF"
          />
        </View>
      </View>
    </Animated.View>
  ), [toolPanelAnimation, insets.bottom, paths, redoStack.length, handleUndo, handleRedo, handleClearDrawing, drawingColor, drawingWidth, drawingOpacity]);
  
  // Sticker tool panel with improved emoji selector
  const renderStickerToolPanel = useMemo(() => () => (
    <Animated.View 
      style={[
        styles.toolPanel,
        {
          opacity: toolPanelAnimation,
          transform: [
            { translateY: toolPanelAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0]
            })}
          ],
          paddingBottom: Math.max(16, insets.bottom)
        }
      ]}
    >
      <View style={styles.toolPanelHeader}>
        <TouchableOpacity 
          style={styles.textStickerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowTextInput(true);
            setInputText('');
            setEditingStickerIndex(null);
          }}
        >
          <MaterialIcons name="text-fields" size={22} color="#FFF" />
          <Text style={styles.textStickerButtonLabel}>Text</Text>
        </TouchableOpacity>
        
        <View style={styles.emojiCategoryTabs}>
          {Object.keys(EMOJI_PACKS).map((packName) => (
            <TouchableOpacity 
              key={packName}
              style={[
                styles.emojiCategoryTab,
                currentEmojiPack === packName && styles.emojiCategoryTabActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentEmojiPack(packName as keyof typeof EMOJI_PACKS);
              }}
            >
              <Text style={styles.emojiCategoryText}>{packName}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.closeToolButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTool(null);
          }}
        >
          <AntDesign name="check" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.emojisGrid}>
        {EMOJI_PACKS[currentEmojiPack].map(emoji => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiButton}
            onPress={() => addSticker(emoji, 'emoji')}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  ), [toolPanelAnimation, insets.bottom, currentEmojiPack, addSticker]);
  
  // Filter tool panel
  const renderFilterToolPanel = useMemo(() => () => (
    <Animated.View 
      style={[
        styles.toolPanel,
        {
          opacity: toolPanelAnimation,
          transform: [
            { translateY: toolPanelAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0]
            })}
          ],
          paddingBottom: Math.max(16, insets.bottom)
        }
      ]}
    >
      <View style={styles.toolPanelHeader}>
        <View style={styles.toolbarControls}>
          <Text style={styles.filterTitle}>Filters</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.closeToolButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedTool(null);
          }}
        >
          <AntDesign name="check" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptionsContainer}
        >
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterOption,
                appliedFilter.id === filter.id && styles.filterOptionActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAppliedFilter(filter);
              }}
            >
              <View style={styles.filterPreview}>
                <Image 
                  source={{ uri: mediaUri }} 
                  style={[
                    styles.filterPreviewImage, 
                    { /* Filter style commented out due to TS errors */ }
                  ]}
                />
              </View>
              <Text style={styles.filterName}>{filter.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {appliedFilter.id !== 'original' && (
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabelRow}>
              <Feather name="sliders" size={20} color="#FFF" />
              <Text style={styles.sliderValueText}>Intensity: {Math.round(filterIntensity * 100)}%</Text>
            </View>
            <Slider
              style={styles.slider}
              value={filterIntensity}
              onValueChange={setFilterIntensity}
              minimumValue={0.1}
              maximumValue={1}
              step={0.05}
              minimumTrackTintColor="#4C68D7"
              maximumTrackTintColor="#555"
              thumbTintColor="#FFF"
            />
          </View>
        )}
      </View>
    </Animated.View>
  ), [toolPanelAnimation, insets.bottom, mediaUri, appliedFilter, filterIntensity]);
  
  // Text input modal with improved design
  const renderTextInputModal = useMemo(() => () => (
    <Modal
      visible={showTextInput}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={styles.textInputContainer}>
            <View style={styles.textInputHeader}>
              <Text style={styles.textInputTitle}>
                {editingStickerIndex !== null ? 'Edit Text' : 'Add Text'}
              </Text>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTextInput(false);
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.textInput, textStyle]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type here..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              multiline
              autoFocus
              maxLength={100}
            />
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.textStylesContainer}
            >
              {TEXT_STYLES.map((style, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.textStyleButton,
                    textStyle.fontFamily === style.fontFamily && 
                    textStyle.fontWeight === style.fontWeight && 
                    textStyle.color === style.color && 
                    styles.selectedTextStyleButton
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTextStyle(style);
                  }}
                >
                  <Text style={[styles.textStyleButtonText, style]}>Aa</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[
                styles.saveTextButton,
                !inputText.trim() && styles.saveTextButtonDisabled
              ]}
              onPress={saveTextSticker}
              disabled={!inputText.trim()}
            >
              <Text style={styles.saveTextButtonText}>
                {editingStickerIndex !== null ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  ), [showTextInput, editingStickerIndex, textStyle, inputText, saveTextSticker]);
  
  // Sticker controls - with CLEAR delete button
  const renderStickerControls = useMemo(() => () => {
    if (!selectedStickerId) return null;
    
    const selectedSticker = stickers.find(s => s.id === selectedStickerId);
    if (!selectedSticker) return null;
    
    return (
      <View style={styles.stickerControlsContainer}>
        {selectedSticker.type === 'text' && (
          <TouchableOpacity
            style={styles.stickerControlButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              editTextSticker(selectedSticker);
            }}
          >
            <Feather name="edit-2" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteSticker(selectedStickerId)}
        >
          <Ionicons name="close-circle" size={40} color="#E1306C" />
        </TouchableOpacity>
      </View>
    );
  }, [selectedStickerId, stickers, editTextSticker, deleteSticker]);
  
  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* ViewShot for capturing the final image */}
      <ViewShot 
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 1 }}
        style={styles.viewShot}
      >
        {/* Background */}
        <View style={[styles.imageContainer, { backgroundColor: bgColor, opacity: bgOpacity }]} />
        
        {/* Main image with filter */}
        <View style={styles.imageWrapper}>
          {/* <SharedElement id={`media.${mediaUri}`} style={StyleSheet.absoluteFill}> */}
            <Image 
              source={{ uri: mediaUri }} 
              style={[
                styles.image, 
                { /* Filter style commented out due to TS errors */ }
              ]}
              resizeMode="contain" 
            />
          {/* </SharedElement> */}
        </View>
        
        {/* Drawing layer */}
        <View style={styles.drawingContainer} pointerEvents="box-none">
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {paths.map(path => (
              <Path
                key={path.id}
                d={serializePath(path.points)}
                stroke={path.color}
                strokeOpacity={path.opacity}
                fill="none"
                strokeWidth={path.width}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </Svg>
        </View>
        
        {/* Stickers layer */}
        <View style={styles.stickersContainer} pointerEvents="box-none">
          {stickers
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((sticker) => {
              const panResponder = createStickerPanResponder(sticker.id);
              
              return (
                <Animated.View
                  key={sticker.id}
                  style={[
                    styles.stickerWrapper,
                    {
                      opacity: sticker.opacity,
                      transform: [
                        { translateX: sticker.x - 50 }, // Center point adjustment
                        { translateY: sticker.y - 50 }, // Center point adjustment
                        { scale: sticker.scale },
                        { rotate: `${sticker.rotation}deg` }
                      ],
                      borderWidth: selectedStickerId === sticker.id ? 1.5 : 0,
                    }
                  ]}
                  {...panResponder.panHandlers}
                >
                  {sticker.type === 'emoji' ? (
                    <Text style={styles.stickerEmoji}>{sticker.content}</Text>
                  ) : (
                    <Text style={[styles.stickerText, sticker.style]}>{sticker.content}</Text>
                  )}
                </Animated.View>
              );
            })}
        </View>
      </ViewShot>
      
      {/* Drawing input layer (separate from ViewShot to avoid capturing touch areas) */}
      {selectedTool === 'draw' && (
        <View 
          style={styles.drawingCanvas}
          onTouchStart={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleDrawStart(locationX, locationY);
          }}
          onTouchMove={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleDrawMove(locationX, locationY);
          }}
          onTouchEnd={handleDrawEnd}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {currentPath.length > 0 && (
              <Path
                d={serializePath(currentPath)}
                stroke={drawingColor}
                strokeOpacity={drawingOpacity}
                fill="none"
                strokeWidth={drawingWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
          </Svg>
        </View>
      )}
      
      {/* UI Elements */}
      {renderStickerControls()}
      {renderToolbar()}
      {selectedTool === 'draw' && renderDrawingToolPanel()}
      {selectedTool === 'sticker' && renderStickerToolPanel()}
      {selectedTool === 'filter' && renderFilterToolPanel()}
      {renderTextInputModal()}
      
      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.processingContent}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.processingText}>{showProcessingMsg}</Text>
          </BlurView>
        </View>
      )}
    </SafeAreaView>
  );
};

// Instagram-inspired styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewShot: {
    flex: 1,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  imageWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  drawingContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  drawingCanvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  stickersContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  
  // Toolbar
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // backdropFilter: 'blur(10px)', // Property not standard in React Native Style
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toolButtonActive: {
    borderColor: '#E1306C',
    backgroundColor: 'rgba(225, 48, 108, 0.2)',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  saveButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tool panels styling
  toolPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    // backdropFilter: 'blur(10px)', // Property not standard in React Native Style
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 9,
  },
  toolPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolPanelTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeToolButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelToolButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 50, 50, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toolbarButtonDisabled: {
    backgroundColor: 'rgba(50, 50, 50, 0.2)',
  },
  
  // Drawing controls
  drawingControls: {
    marginTop: 8,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderValueText: {
    color: '#FFF',
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  colorButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedColorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
  },
  
  // Emojis
  textStickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(225, 48, 108, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(225, 48, 108, 0.7)',
  },
  textStickerButtonLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emojiCategoryTabs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiCategoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(50, 50, 50, 0.5)',
  },
  emojiCategoryTabActive: {
    backgroundColor: 'rgba(225, 48, 108, 0.5)',
  },
  emojiCategoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emojisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  emojiButton: {
    width: (SCREEN_WIDTH - 62) / 6, // 6 emojis per row with spacing
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  emojiText: {
    fontSize: 30,
  },
  
  // Text input
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  textInputContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  textInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textInputTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    maxHeight: 150,
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  textStylesContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  textStyleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
  },
  selectedTextStyleButton: {
    borderWidth: 2,
    borderColor: '#E1306C',
  },
  textStyleButtonText: {
    fontSize: 22,
  },
  saveTextButton: {
    backgroundColor: '#E1306C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveTextButtonDisabled: {
    backgroundColor: 'rgba(225, 48, 108, 0.5)',
  },
  saveTextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Sticker styles
  stickerWrapper: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    width: 100, // Base width, scaled by transform
    height: 100, // Base height, scaled by transform
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerEmoji: {
    fontSize: 50,
    textAlign: 'center',
  },
  stickerText: {
    padding: 8,
    textAlign: 'center',
  },
  stickerControlsContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    // backdropFilter: 'blur(10px)', // Property not standard in React Native Style
    borderRadius: 16,
    padding: 8,
    zIndex: 25,
  },
  stickerControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  deleteButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  
  // Filters
  filterTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filterOptionsContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  filterOption: {
    marginRight: 12,
    alignItems: 'center',
    width: 70,
  },
  filterOptionActive: {
    backgroundColor: 'rgba(76, 104, 215, 0.2)',
    borderRadius: 8,
    paddingTop: 4,
  },
  filterPreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  
  // Processing
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingContent: {
    width: 220,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default StoryEditor;