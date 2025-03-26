import React, { useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  FlatList,
  FlatListProps,
  ListRenderItem,
  ListRenderItemInfo,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';

import { sp } from '../utils/responsive';

interface AnimatedListProps extends Omit<FlatListProps<any>, 'renderItem'> {
  renderItem: ListRenderItem<any>;
  containerStyle?: ViewStyle;
  itemContainerStyle?: ViewStyle;
  itemSpacing?: number;
  staggerDelay?: number;
  noAnimation?: boolean;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  data,
  renderItem,
  containerStyle,
  itemContainerStyle,
  itemSpacing = 10,
  staggerDelay = 50,
  noAnimation = false,
  ...props
}) => {
  const listRef = useRef<FlatList>(null);

  // Wrapper pour ajouter des animations aux éléments de la liste
  const renderItemWithAnimation = useCallback(
    (info: ListRenderItemInfo<any>) => {
      const { item, index } = info;
      
      if (noAnimation) {
        return (
          <View 
            style={[
              styles.itemContainer, 
              itemContainerStyle, 
              { marginBottom: itemSpacing }
            ]}
          >
            {renderItem(info)}
          </View>
        );
      }

      return (
        <Animated.View
          style={[
            styles.itemContainer, 
            itemContainerStyle, 
            { marginBottom: itemSpacing }
          ]}
          entering={SlideInRight.delay(index * staggerDelay).duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
        >
          {renderItem(info)}
        </Animated.View>
      );
    },
    [renderItem, staggerDelay, itemSpacing, itemContainerStyle, noAnimation]
  );

  // Remonter en haut de la liste avec animation
  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      entering={FadeIn.duration(300)}
    >
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItemWithAnimation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        {...props}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingVertical: sp(8),
  },
  itemContainer: {
    width: '100%',
  },
});

export default AnimatedList;