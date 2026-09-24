import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from 'react-native';

const FIELD_GAP = 20;

export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const focusedField = useRef<View | null>(null);
  const keyboardTop = useRef(0);
  const [bottomInset, setBottomInset] = useState(0);

  const reveal = useCallback((top: number) => {
    const field = focusedField.current;
    if (!field || top <= 0) {
      return;
    }

    field.measureInWindow((_x, y, _width, height) => {
      const overlap = y + height + FIELD_GAP - top;
      if (overlap > 0) {
        scrollRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
      }
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      const resized = windowHeight <= event.endCoordinates.screenY + 1;
      const top = resized ? windowHeight : event.endCoordinates.screenY;
      keyboardTop.current = top;
      if (resized) {
        setBottomInset(0);
        setTimeout(() => reveal(top), 60);
        return;
      }
      setBottomInset(event.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = 0;
      setBottomInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [reveal]);

  useEffect(() => {
    if (bottomInset <= 0 || keyboardTop.current <= 0) {
      return;
    }
    const id = setTimeout(() => reveal(keyboardTop.current), 120);
    return () => clearTimeout(id);
  }, [bottomInset, reveal]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onFieldFocus = useCallback(
    (field: View | null) => {
      focusedField.current = field;
      if (keyboardTop.current > 0) {
        setTimeout(() => reveal(keyboardTop.current), 60);
      }
    },
    [reveal],
  );

  return { scrollRef, bottomInset, onScroll, onFieldFocus };
}
