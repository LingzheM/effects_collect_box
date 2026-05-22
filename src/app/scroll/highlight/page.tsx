"use client"

import ScrollHighlightText from './HighlightText'
import './HighlightText.css'

export default function Page() {
  return (
    <div className='app-wrapper'>
      <div className='spacer'>
        <div className='hint'>👇向下</div>
      </div>

      <section className='section'>
        <ScrollHighlightText text="Our selection standards" />
      </section>

      <section className='section'>
        <ScrollHighlightText text="when and where SUNNY" />
      </section>

      <div className='spacer'>
        <div className='hint'>👆</div>
      </div>
    </div>
  )
}