import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownwardOutlined,
  InfoOutlined,
  Settings,
} from '@mui/icons-material';
import {
  Button,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';

import DefaultPrompts from '@/components/DefaultPrompts/DefaultPrompts';
import QuickActions from '@/components/QuickActions/QuickActions';

import NavigationIcon from '@/assets/svg/Navigation.svg';

import { MESSAGE_ROLE, MESSAGE_TYPES } from '@/constants/bots';

import CenterChatContentNoMessages from './CenterChatContentNoMessages';
import ChatSpinner from './ChatSpinner';
import Message from './Message';
import styles from './styles';

import {
  openInfoChat,
  resetChat,
  setChatSession,
  setError,
  setFullyScrolled,
  setInput,
  setMessages,
  setMore,
  setSessionLoaded,
  setStreaming,
  setStreamingDone,
  setTyping,
} from '@/redux/slices/chatSlice';
import { firestore } from '@/redux/store';
import createChatSession from '@/services/chatbot/createChatSession';
import sendMessage from '@/services/chatbot/sendMessage';

const ChatInterface = () => {
  const messagesContainerRef = useRef();

  const dispatch = useDispatch();
  const {
    more,
    input,
    typing,
    chat,
    sessionLoaded,
    openSettingsChat,
    infoChatOpened,
    fullyScrolled,
    streamingDone,
    streaming,
    error,
  } = useSelector((state) => state.chat);
  const { data: userData } = useSelector((state) => state.user);
  // eslint-disable-next-line
  const sessionId = localStorage.getItem('sessionId');

  const currentSession = chat;
  const chatMessages = currentSession?.messages;
  const showNewMessageIndicator = !fullyScrolled && streamingDone;
  const [isOnDefaultPrompts, setOnDefaultPrompts] = useState(false);
  const startConversation = async (message) => {
    dispatch(
      setMessages({
        role: MESSAGE_ROLE.AI,
      })
    );
    dispatch(setTyping(true));

    const chatPayload = {
      user: {
        id: userData?.id,
        fullName: userData?.fullName,
        email: userData?.email,
      },
      type: 'chat',
      message,
    };

    const { status, data } = await createChatSession(chatPayload, dispatch);

    dispatch(setTyping(false));
    if (status === 'created') dispatch(setStreaming(true));
    dispatch(setChatSession(data));
    dispatch(setSessionLoaded(true));
  };

  useEffect(() => {
    return () => {
      localStorage.removeItem('sessionId');
      dispatch(resetChat());
    };
  }, []);

  useEffect(() => {
    let unsubscribe;

    if (sessionLoaded || currentSession) {
      messagesContainerRef.current?.scrollTo(
        0,
        messagesContainerRef.current?.scrollHeight,
        {
          behavior: 'smooth',
        }
      );

      const sessionRef = query(
        collection(firestore, 'chatSessions'),
        where('id', '==', sessionId)
      );

      unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const updatedData = change.doc.data();
            const updatedMessages = updatedData.messages;

            const lastMessage = updatedMessages[updatedMessages.length - 1];

            if (lastMessage?.role === MESSAGE_ROLE.AI) {
              dispatch(
                setMessages({
                  role: MESSAGE_ROLE.AI,
                  response: lastMessage,
                })
              );
              dispatch(setTyping(false));
            }
          }
        });
      });
    }

    return () => {
      if (sessionLoaded || currentSession) unsubscribe();
    };
  }, [sessionLoaded]);

  const handleOnScroll = () => {
    const scrolled =
      Math.abs(
        messagesContainerRef.current.scrollHeight -
          messagesContainerRef.current.clientHeight -
          messagesContainerRef.current.scrollTop
      ) <= 1;

    if (fullyScrolled !== scrolled) dispatch(setFullyScrolled(scrolled));
  };

  const handleScrollToBottom = () => {
    messagesContainerRef.current?.scrollTo(
      0,
      messagesContainerRef.current?.scrollHeight,
      {
        behavior: 'smooth',
      }
    );

    dispatch(setStreamingDone(false));
  };

  const handleSendMessage = async (action) => {
    dispatch(setStreaming(true));
    // console.log(isOnDefaultPrompts);
    if (!input && isOnDefaultPrompts) {
      dispatch(setError('Please enter a message'));
      setTimeout(() => {
        dispatch(setError(null));
      }, 3000);
      return;
    }

    const message = {
      role: MESSAGE_ROLE.HUMAN,
      type: MESSAGE_TYPES.TEXT,
      payload: {
        text: !isOnDefaultPrompts ? action : input,
      },
    };

    if (!chatMessages) {
      await startConversation(message);
      return;
    }

    dispatch(
      setMessages({
        role: MESSAGE_ROLE.HUMAN,
      })
    );

    dispatch(setTyping(true));

    await sendMessage({ message, id: sessionId }, dispatch);
  };

  const handleQuickReply = async (option) => {
    dispatch(setInput(option));
    dispatch(setStreaming(true));

    const message = {
      role: MESSAGE_ROLE.HUMAN,
      type: MESSAGE_TYPES.QUICK_REPLY,
      payload: {
        text: option,
      },
    };

    dispatch(
      setMessages({
        role: MESSAGE_ROLE.HUMAN,
      })
    );
    dispatch(setTyping(true));

    await sendMessage({ message, id: currentSession?.id }, dispatch);
  };

  const keyDownHandler = async (e) => {
    if (typing || !input || streaming) return;
    if (e.keyCode === 13) handleSendMessage();
  };

  const renderSendIcon = () => {
    return (
      <InputAdornment position="end">
        <IconButton
          onClick={handleSendMessage}
          {...styles.bottomChatContent.iconButtonProps(
            typing || error || !input || streaming
          )}
        >
          <NavigationIcon />
        </IconButton>
      </InputAdornment>
    );
  };

  const renderQuickActions = () => {
    return (
      <InputAdornment position="start">
        <QuickActions
          onAction={(action) => {
            let str = '';
            if (action === 'Default') {
              // eslint-disable-next-line prettier/prettier
              str = 'Let\'s have a random normal conversation';
            } else {
              str = `I want to specifically talk in the topic of ${action}, please prepare for it`;
            }
            dispatch(setInput(str));
          }}
        />
      </InputAdornment>
    );
  };

  // eslint-disable-next-line consistent-return
  const renderDefaultPrompts = () => {
    // console.log(isOnDefaultPrompts);
    if (!isOnDefaultPrompts) {
      return (
        <DefaultPrompts
          onAction={(action) => {
            setOnDefaultPrompts(true);
            handleSendMessage(action);
          }}
        />
      );
    }
  };

  const renderMoreChat = () => {
    if (!more) return null;
    return (
      <Grid {...styles.moreChat.moreChatProps}>
        <Grid {...styles.moreChat.contentMoreChatProps}>
          <Settings {...styles.moreChat.iconProps} />
          <Typography {...styles.moreChat.titleProps}>Settings</Typography>
        </Grid>
        <Grid
          {...styles.moreChat.contentMoreChatProps}
          onClick={() => dispatch(openInfoChat())}
        >
          <InfoOutlined {...styles.moreChat.iconProps} />
          <Typography {...styles.moreChat.titleProps}>Information</Typography>
        </Grid>
      </Grid>
    );
  };

  const renderCenterChatContent = () => {
    if (
      !openSettingsChat &&
      !infoChatOpened &&
      chatMessages?.length !== 0 &&
      !!chatMessages
    )
      return (
        <Grid
          onClick={() => dispatch(setMore({ role: 'shutdown' }))}
          {...styles.centerChat.centerChatGridProps}
        >
          <Grid
            ref={messagesContainerRef}
            onScroll={handleOnScroll}
            {...styles.centerChat.messagesGridProps}
          >
            {chatMessages?.map(
              (message, index) =>
                message?.role !== MESSAGE_ROLE.SYSTEM && (
                  <Message
                    ref={messagesContainerRef}
                    {...message}
                    messagesLength={chatMessages?.length}
                    messageNo={index + 1}
                    onQuickReply={handleQuickReply}
                    streaming={streaming}
                    fullyScrolled={fullyScrolled}
                    key={index}
                  />
                )
            )}
            {typing && <ChatSpinner />}
          </Grid>
        </Grid>
      );

    return null;
  };

  const renderCenterChatContentNoMessages = () => {
    if ((chatMessages?.length === 0 || !chatMessages) && !infoChatOpened)
      return <CenterChatContentNoMessages />;
    return null;
  };

  const renderNewMessageIndicator = () => {
    return (
      <Fade in={showNewMessageIndicator}>
        <Button
          startIcon={<ArrowDownwardOutlined />}
          onClick={handleScrollToBottom}
          {...styles.newMessageButtonProps}
        />
      </Fade>
    );
  };

  const renderBottomChatContent = () => {
    if (!openSettingsChat && !infoChatOpened)
      return (
        <Grid
          {...styles.bottomChatContent.bottomChatContentGridProps}
          sx={{ alignItems: 'center', paddingLeft: '10px' }}
        >
          <TextField
            value={input}
            onChange={(e) => dispatch(setInput(e.currentTarget.value))}
            onKeyUp={keyDownHandler}
            error={!!error}
            helperText={error}
            disabled={!!error}
            focused={false}
            {...styles.bottomChatContent.chatInputProps(
              renderSendIcon,
              renderQuickActions,
              !!error,
              input
            )}
            sx={{ flex: 1, marginLeft: '10px' }}
          />
        </Grid>
      );

    return null;
  };

  return (
    <Grid {...styles.mainGridProps}>
      {renderMoreChat()}
      {renderCenterChatContent()}
      {renderCenterChatContentNoMessages()}
      {renderNewMessageIndicator()}
      {renderDefaultPrompts()}
      {renderBottomChatContent()}
    </Grid>
  );
};

export default ChatInterface;
