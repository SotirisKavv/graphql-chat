import React, { useState } from 'react';
import classNames from 'classnames';
import moment from 'moment';
import { useAuthState } from '../../context/auth';
import { gql, useMutation } from '@apollo/client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile } from '@fortawesome/free-regular-svg-icons';
import { Button, OverlayTrigger, Popover, Tooltip } from 'react-bootstrap';

const reactions = ['❤️', '😆', '😯', '😢', '😡', '👍', '👎'];

const REACT_TO_MESSAGE = gql`
  mutation reactToMessage($uuid: String!, $content: String!) {
    reactToMessage(uuid: $uuid, content: $content) {
      uuid
    }
  }
`;

export default function Message({ message, sameSender }) {
  const { user } = useAuthState();
  const [pop, setPop] = useState(false);
  const [reactToMessage] = useMutation(REACT_TO_MESSAGE, {
    onError: (err) => console.log(err),
    onCompleted: (data) => setPop(false),
  });

  const reactionIcons = [...new Set(message.reactions.map((r) => r.content))];
  const sent = message.from === user.username;
  const received = !sent;

  const react = (reaction) => {
    reactToMessage({ variables: { uuid: message.uuid, content: reaction } });
  };

  const reactButton = (
    <OverlayTrigger
      trigger='click'
      placement='top'
      show={pop}
      onToggle={setPop}
      transition={false}
      rootClose
      overlay={
        <Popover className='rounded-pill react-button-popover'>
          {reactions.map((reaction) => (
            <Button
              variant='link'
              key={reaction}
              className='react-icon-button'
              onClick={() => react(reaction)}
            >
              {reaction}
            </Button>
          ))}
        </Popover>
      }
    >
      <Button variant='link' className='px-2'>
        <FontAwesomeIcon icon={faSmile} />
      </Button>
    </OverlayTrigger>
  );

  return (
    <div
      className={classNames(`d-flex ${sameSender ? 'mb-1' : 'mb-4'}`, {
        'ml-auto': sent,
        'mr-auto': received,
      })}
    >
      {sent && reactButton}
      <OverlayTrigger
        placement={sent ? 'left' : 'right'}
        overlay={
          <Tooltip>
            {moment(message.createdAt).format('MMMM DD, YYYY @ h:mm a')}
          </Tooltip>
        }
      >
        <div
          className={classNames('py-2 px-3 rounded-pill position-relative', {
            'bg-primary': sent,
            'bg-secondary': received,
          })}
        >
          {message.reactions.length > 0 && (
            <div className='reactions-div bg-secondary p-1 rounded-pill'>
              {reactionIcons} {message.reactions.length}
            </div>
          )}
          <p className={sent ? 'text-white' : ''}>{message.content}</p>
        </div>
      </OverlayTrigger>
      {received && reactButton}
    </div>
  );
}
