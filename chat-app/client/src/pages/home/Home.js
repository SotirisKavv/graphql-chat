import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription, gql } from '@apollo/client';

import { Button, Col, Row } from 'react-bootstrap';

import { useMessageDispatch } from '../../context/message';
import { useAuthDispatch, useAuthState } from '../../context/auth';

import Users from './Users';
import Messages from './Messages';

const NEW_MESSAGE = gql`
  subscription newMessage {
    newMessage {
      content
      from
      to
      uuid
      createdAt
    }
  }
`;

const NEW_REACTION = gql`
  subscription newReaction {
    newReaction {
      content
      createdAt
      uuid
      message {
        uuid
        from
        to
      }
    }
  }
`;

export default function Home() {
  const authDispatch = useAuthDispatch();
  const msgDispatch = useMessageDispatch();

  const { user } = useAuthState();
  const { data: messageData, error: messageError } =
    useSubscription(NEW_MESSAGE);
  const { data: reactionData, error: reactionError } =
    useSubscription(NEW_REACTION);

  useEffect(() => {
    if (messageError) console.log(messageError);

    if (messageData) {
      const message = messageData.newMessage;
      const to = user.username === message.to ? message.from : message.to;

      msgDispatch({
        type: 'ADD_MESSAGE',
        payload: {
          username: to,
          message,
        },
      });
    }
  }, [messageError, messageData]);

  useEffect(() => {
    if (reactionError) console.log(reactionError);

    if (reactionData) {
      const reaction = reactionData.newReaction;
      const to =
        user.username === reaction.message.to
          ? reaction.message.from
          : reaction.message.to;

      msgDispatch({
        type: 'ADD_REACTION',
        payload: {
          username: to,
          reaction,
        },
      });
    }
  }, [reactionError, reactionData]);

  const logout = () => {
    authDispatch({ type: 'LOGOUT' });
    window.location.href = '/login';
  };

  return (
    <>
      <Row className='bg-white d-flex justify-content-center align-items-center flex-wrap mb-1'>
        <Col>
          <Link to={'/register'}>
            <Button variant='link'>Register</Button>
          </Link>
          <Link to={'/login'}>
            <Button variant='link'>Login</Button>
          </Link>
          <Button variant='link' onClick={logout}>
            Logout
          </Button>
        </Col>
        <Col className='ml-auto'>{user.username}</Col>
      </Row>
      <Row className='bg-white'>
        <Users />
        <Messages />
      </Row>
    </>
  );
}
