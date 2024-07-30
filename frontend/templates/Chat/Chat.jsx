/* eslint-disable quotes */
import React, { useEffect, useRef, useState } from 'react';

import { ArrowDownwardOutlined } from '@mui/icons-material';
import {
  Button,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';

import DiscoveryLibrary from '@/components/DiscoveryLibrary/DiscoveryLibrary';
import NavBar from '@/components/NavBar/NavBar';
import QuickActions from '@/components/QuickActions/QuickActions';

import NavigationIcon from '@/assets/svg/Navigation.svg';

import { MESSAGE_ROLE, MESSAGE_TYPES } from '@/constants/bots';

import CenterChatContentNoMessages from './CenterChatContentNoMessages';
import ChatSpinner from './ChatSpinner';
import Message from './Message';
import styles from './styles';

import {
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
    input,
    typing,
    chat,
    sessionLoaded,
    fullyScrolled,
    streamingDone,
    streaming,
    error,
  } = useSelector((state) => state.chat);
  const { data: userData } = useSelector((state) => state.user);
  const [, setSelectedAction] = useState('');
  const [promptInChat, setPromptInChat] = useState('');
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const sessionId = localStorage.getItem('sessionId');

  const currentSession = chat;
  const chatMessages = currentSession?.messages;
  const showNewMessageIndicator = !fullyScrolled && streamingDone;

  // Function to render additional chat options

  const startConversation = async (message) => {
    dispatch(setMessages({ role: MESSAGE_ROLE.AI }));
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
        { behavior: 'smooth' }
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
                setMessages({ role: MESSAGE_ROLE.AI, response: lastMessage })
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
      { behavior: 'smooth' }
    );
    dispatch(setStreamingDone(false));
  };

  const handleSendMessage = async () => {
    dispatch(setStreaming(true));

    if (!input) {
      dispatch(setError('Please enter a message'));
      setTimeout(() => {
        dispatch(setError(null));
      }, 3000);
      return;
    }

    const message = {
      role: MESSAGE_ROLE.HUMAN,
      type: MESSAGE_TYPES.TEXT,
      payload: { text: input },
    };

    if (!chatMessages) {
      await startConversation(message);
      return;
    }

    dispatch(setMessages({ role: MESSAGE_ROLE.HUMAN }));
    dispatch(setTyping(true));

    await sendMessage({ message, id: sessionId }, dispatch);
  };

  const handleQuickReply = async (option) => {
    dispatch(setInput(option));
    dispatch(setStreaming(true));

    const message = {
      role: MESSAGE_ROLE.HUMAN,
      type: MESSAGE_TYPES.QUICK_REPLY,
      payload: { text: option },
    };

    dispatch(setMessages({ role: MESSAGE_ROLE.HUMAN }));
    dispatch(setTyping(true));

    await sendMessage({ message, id: currentSession?.id }, dispatch);
  };

  const handleQuickAction = (action) => {
    setSelectedAction(action);
    if (action === 'Default') {
      setPromptInChat("Let's have a random normal conversation");
    } else {
      const str = `I want to specifically talk in the topic of ${action}, please prepare for it`;
      setPromptInChat(str);
    }
  };

  const keyDownHandler = async (e) => {
    if (typing || !input || streaming) return;
    if (e.keyCode === 13) handleSendMessage();
  };

  const handleSelectPrompt = (prompt) => {
    dispatch(setInput(prompt.description));
    setPromptInChat(prompt.description);
  };

  const renderSendIcon = () => (
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

  const renderQuickActions = () => (
    <InputAdornment position="start">
      <QuickActions onAction={handleQuickAction} />
    </InputAdornment>
  );

  const renderCenterChatContent = () => {
    if (!isDiscoveryOpen && chatMessages?.length) {
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
    }
    return null;
  };

  const renderCenterChatContentNoMessages = () => {
    if (!isDiscoveryOpen && (!chatMessages?.length || !chatMessages)) {
      return <CenterChatContentNoMessages />;
    }
    return null;
  };

  const renderDiscoveryLibrary = () => {
    const customPrompts = [
      {
        title: 'Interactive Techniques',
        description: 'Learn about interactive teaching techniques.',
      },
      {
        title: 'Coding Books',
        description: 'Recommended books for learning coding.',
      },
      // Other custom prompts
    ];

    return (
      <Grid container>
        <Grid item xs={12} sm={4} md={3} style={{ padding: '20px' }}>
          {isDiscoveryOpen && (
            <DiscoveryLibrary
              prompts={customPrompts}
              onSelect={handleSelectPrompt}
            />
          )}
        </Grid>
        <Grid
          item
          xs={12}
          sm={isDiscoveryOpen ? 8 : 12}
          md={isDiscoveryOpen ? 9 : 12}
          style={{ padding: '20px' }}
        >
          {renderCenterChatContent()}
          {renderCenterChatContentNoMessages()}
        </Grid>
      </Grid>
    );
  };

  const renderNewMessageIndicator = () => (
    <Fade in={showNewMessageIndicator}>
      <Button
        startIcon={<ArrowDownwardOutlined />}
        onClick={handleScrollToBottom}
        {...styles.newMessageButtonProps}
      />
    </Fade>
  );

  const renderBottomChatContent = () => (
    <Grid
      {...styles.bottomChatContent.bottomChatContentGridProps}
      sx={{ alignItems: 'center', paddingLeft: '10px' }}
    >
      <TextField
        value={promptInChat}
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

  return (
    <Grid {...styles.mainGridProps}>
      <NavBar
        onDiscoveryClick={() => setIsDiscoveryOpen(true)}
        onChatClick={() => setIsDiscoveryOpen(false)}
      />
      {renderDiscoveryLibrary()}
      {renderNewMessageIndicator()}
      {renderBottomChatContent()}
    </Grid>
  );
};

export default ChatInterface;
