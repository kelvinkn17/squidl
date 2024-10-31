import { Link } from '@nextui-org/react'
import React from 'react'

export default function EngowlWatermark() {
  return (
    <div
      className="fixed top-0 z-10 w-full none lg:block"
    >
      <div className='bg-white border border-black/20 px-4 rounded-full py-1 mx-auto mt-2 shadow-lg shadow-black/5 w-fit mb-2'>
        <div className="flex flex-col text-xs items-center font-sans">
          <div className='flex flex-row items-center'>
            Made with ❤️ by&nbsp;
            <Link href='https://engowl.studio'
              target='_blank'
              rel='noreferrer'
              className='font-medium text-xs'
            >
              Engowl Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
