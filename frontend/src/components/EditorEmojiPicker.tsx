import { Menu, Transition } from "@headlessui/react";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import { Fragment } from "react";
import useEmojis from "../hooks/useEmojis";

interface Props {
  onSelect: (emoji: string) => void;
}

export default function EditorEmojiPicker({ onSelect }: Props) {
  const emojis = useEmojis();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="relative bg-dark-2 hover:bg-dark-1 h-6 w-6 rounded flex items-center justify-center">
          <span className="sr-only">Change published status</span>
          <EmojiHappyIcon className="w-4 h-4" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-dark-3 flex items-center justify-center p-1">
          <div className="grid grid-cols-4">
            {emojis?.map((e) => (
              <Menu.Item key={e.id}>
                <div
                  className="p-1 hover:bg-dark-5 rounded cursor-pointer"
                  onClick={() =>
                    onSelect(`<${e.animated ? "a" : ""}:${e.name}:${e.id}>`)
                  }
                >
                  <img
                    src={`https://cdn.discordapp.com/emojis/${e.id}.${
                      e.animated ? "gif" : "png"
                    }`}
                    className="w-8 h-8 rounded-sm"
                    alt=""
                  />
                </div>
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
