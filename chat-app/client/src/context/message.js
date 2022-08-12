import React, { createContext, useReducer, useContext } from 'react';

const MessageStateContext = createContext();
const MessageDispatchContext = createContext();

const messageReducer = (state, action) => {
  let users, userIndex;
  const { username, message, messages, reaction } = action.payload;

  switch (action.type) {
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'SET_USER_MESSAGES':
      users = [...state.users];

      userIndex = users.findIndex((u) => u.username === username);

      users[userIndex] = { ...users[userIndex], messages };

      return {
        ...state,
        users,
      };

    case 'SET_SELECTED_USER':
      users = state.users.map((user) => ({
        ...user,
        selected: user.username === action.payload,
      }));
      return {
        ...state,
        users,
      };
    case 'ADD_MESSAGE':
      users = [...state.users];

      userIndex = users.findIndex((u) => u.username === username);

      message.reactions = [];

      let nuser = {
        ...users[userIndex],
        messages: users[userIndex].messages
          ? [message, ...users[userIndex].messages]
          : null,
        latestMsg: message,
      };

      users[userIndex] = nuser;

      return {
        ...state,
        users,
      };
    case 'ADD_REACTION':
      users = [...state.users];

      userIndex = users.findIndex((u) => u.username === username);

      let user = {
        ...users[userIndex],
      };

      const msgIndex = user.messages?.findIndex(
        (m) => m.uuid === reaction.message.uuid
      );

      if (msgIndex > -1) {
        let messages = [...user.messages];
        let reactions = [...messages[msgIndex].reactions];

        const reactionIndex = reactions.findIndex(
          (r) => r.uuid === reaction.uuid
        );

        if (reactionIndex > -1) {
          reactions[reactionIndex] = reaction;
        } else {
          reactions = [...reactions, reaction];
        }

        messages[msgIndex] = { ...messages[msgIndex], reactions };

        users[userIndex] = { ...user, messages };
      }

      return {
        ...state,
        users,
      };
    default:
      throw new Error(`Uknown action type: ${action.type}`);
  }
};

export const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, { users: null });

  return (
    <MessageDispatchContext.Provider value={dispatch}>
      <MessageStateContext.Provider value={state}>
        {children}
      </MessageStateContext.Provider>
    </MessageDispatchContext.Provider>
  );
};

export const useMessageState = () => useContext(MessageStateContext);
export const useMessageDispatch = () => useContext(MessageDispatchContext);
