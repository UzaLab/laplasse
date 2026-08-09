import { useEffect, useState } from 'react'
import { FlatList, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native'

interface HorizontalCarouselProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  itemWidth?: number
  gap?: number
  contentContainerStyle?: ViewStyle
}

export function HorizontalCarousel<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth,
  gap = 12,
  contentContainerStyle,
}: HorizontalCarouselProps<T>) {
  if (itemWidth) {
    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <View style={{ width: itemWidth, marginRight: gap }}>{renderItem(item, index)}</View>
        )}
        contentContainerStyle={[styles.track, contentContainerStyle]}
        decelerationRate="fast"
        snapToInterval={itemWidth + gap}
      />
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.track, contentContainerStyle]}
    >
      {data.map((item, index) => (
        <View key={keyExtractor(item)} style={{ marginRight: gap }}>
          {renderItem(item, index)}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
})
