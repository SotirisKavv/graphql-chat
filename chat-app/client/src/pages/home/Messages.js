import React, { useEffect, useState } from 'react';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import { useMessageState, useMessageDispatch } from '../../context/message';

import { Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import Message from './Message';

const GET_MESSAGES = gql`
  query getMessages($from: String!) {
    getMessages(from: $from) {
      uuid
      from
      to
      content
      reactions {
        uuid
        content
      }
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation sendMessage($to: String!, $content: String!) {
    sendMessage(to: $to, content: $content) {
      from
      to
      content
    }
  }
`;

export default function Messages() {
  const dispatch = useMessageDispatch();
  const { users } = useMessageState();

  const selectedUser = users?.find((u) => u.selected === true);
  const messages = selectedUser?.messages;

  const [content, setContent] = useState('');
  const [getMessages, { loading: messagesLoading, data: messagesData }] =
    useLazyQuery(GET_MESSAGES);
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    onError: (err) => console.log(err),
  });

  useEffect(() => {
    if (selectedUser && !selectedUser.messages) {
      getMessages({ variables: { from: selectedUser.username } });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (messagesData) {
      dispatch({
        type: 'SET_USER_MESSAGES',
        payload: {
          username: selectedUser.username,
          messages: messagesData.getMessages,
        },
      });
    }
  }, [messagesData]);

  const submitMessage = (e) => {
    e.preventDefault();

    if (content.trim() === '' || !selectedUser) return;
    sendMessage({ variables: { to: selectedUser.username, content } });
    setContent('');
  };

  let selectedChatMarkup;
  if (!messages && !messagesLoading) {
    selectedChatMarkup = <p className='info-text'>Select a friend</p>;
  } else if (messagesLoading) {
    selectedChatMarkup = <p className='info-text'>Loading..</p>;
  } else if (messages.length > 0) {
    selectedChatMarkup = messages.map((m, i) => {
      const lastSender = messages[i - 1]
        ? messages[i - 1].from
        : messages[i].from;
      return (
        <React.Fragment key={m.uuid}>
          <Message message={m} sameSender={m.from === lastSender} />
          {i === m.length - 1 && (
            <div className='invisible'>
              <hr className='m-0' />
            </div>
          )}
        </React.Fragment>
      );
    });
  } else if (messages.length === 0) {
    selectedChatMarkup = <p className='info-text'>You are now connected!</p>;
  }

  return (
    <Col xs={10} md={8} className='p-0'>
      <div className='messages-box d-flex flex-column-reverse p-3'>
        {selectedChatMarkup}
      </div>
      <div className='px-3 py-2'>
        <Form onSubmit={submitMessage}>
          <Form.Group className='d-flex align-items-center m-0'>
            <Form.Control
              type='text'
              className='message-input rounded-pill bg-secondary border-0'
              placeholder='Type a message..'
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <FontAwesomeIcon
              className='mx-2'
              icon={faPaperPlane}
              size='2x'
              color='#1877f2'
              onClick={submitMessage}
              role='button'
            />
          </Form.Group>
        </Form>
      </div>
    </Col>
  );
}
