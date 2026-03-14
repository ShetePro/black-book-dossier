import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { ThemedText } from '@/components/ThemedText';

interface AudioPlayerProps {
  audioUri: string;
  primaryColor?: string;
  textMutedColor?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUri,
  primaryColor = '#c9a962',
  textMutedColor = '#737373',
}) => {
  const {
    isPlaying,
    position,
    duration,
    loadAudio,
    togglePlayback,
    formatTime,
  } = useAudioPlayback();

  useEffect(() => {
    if (audioUri) {
      loadAudio(audioUri);
    }
  }, [audioUri, loadAudio]);

  const progressPercent = duration > 0 
    ? Math.min((position / duration) * 100, 100)
    : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: primaryColor }]}
        onPress={togglePlayback}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={24}
          color="#0a0a0a"
        />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${textMutedColor}40` }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: primaryColor,
              },
            ]}
          />
        </View>
        <View style={styles.timeContainer}>
          <ThemedText style={[styles.timeText, { color: textMutedColor }]}>
            {formatTime(position)}
          </ThemedText>
          <ThemedText style={[styles.timeText, { color: textMutedColor }]}>
            {formatTime(duration)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
