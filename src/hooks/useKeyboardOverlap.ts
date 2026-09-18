import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, LayoutAnimation, Platform, type KeyboardEvent } from 'react-native';

function overlapFromEvent(event: KeyboardEvent) {
  const screenHeight = Dimensions.get('screen').height;
  return Math.max(0, screenHeight - event.endCoordinates.screenY);
}

export function useKeyboardOverlap(enabled = true) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOverlap(0);
      return;
    }

    function syncKeyboard(event: KeyboardEvent, visible: boolean) {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext({
          duration: event.duration > 0 ? event.duration : 250,
          update: { type: LayoutAnimation.Types.keyboard },
        });
      }

      setOverlap(visible ? overlapFromEvent(event) : 0);
    }

    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => syncKeyboard(event, true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => syncKeyboard(event, false),
    );
    const changeFrame = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame',
      (event) => {
        const nextOverlap = overlapFromEvent(event);
        syncKeyboard(event, nextOverlap > 0);
      },
    );

    return () => {
      show.remove();
      hide.remove();
      changeFrame.remove();
    };
  }, [enabled]);

  return overlap;
}
