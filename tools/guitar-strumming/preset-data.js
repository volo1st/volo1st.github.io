(function initializePresetData(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = data;
  }
  if (root) {
    root.GuitarStrummingPresetData = data;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPresetData() {
  'use strict';

  const sharedArrangements = [
    {
      id: 'viva-la-vida-v1',
      title: 'Viva La Vida',
      gridHeader: '4/4#8',
      originalKey: 'Ab major',
      notation: 'numbers',
      chordSource: '| 4 5@8 | 5 | 1 6:m@8 | 6:m |',
      strumSource: `| D - D - D - D U |
| - U - U D - D U3p |
| D - D - D - D U |
| - U - U D - D U3p |`,
      rightsBasis: 'Short user transcription',
      rightsNotice: 'Unofficial user transcription for teaching. No lyrics, melody notation, audio, or artwork.',
    },
  ];

  const exerciseProfiles = [
    {
      slug: 'viva-la-vida-melody-backing-c-v1',
      arrangementId: 'viva-la-vida-v1',
      title: 'Viva La Vida — melody backing in C',
      presetType: 'Song exercise',
      teachingLevel: 'Beginner',
      teachingGoal: 'Use a C-major backing track for melody practice.',
      tags: ['song-exercise', 'melody-backing', 'c-major', 'eighth-notes'],
      playingKey: 'C major',
      bpm: 135,
      countIn: 1,
      tempoRamp: 'off',
      capo: 0,
      swing: 'off',
    },
    {
      slug: 'viva-la-vida-syncopated-strumming-g-v1',
      arrangementId: 'viva-la-vida-v1',
      title: 'Viva La Vida — syncopated strumming in G',
      presetType: 'Song exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practise syncopated eighth-note strumming and mid-bar chord changes in G major.',
      tags: ['song-exercise', 'syncopation', 'mid-bar-changes', 'g-major'],
      playingKey: 'G major',
      bpm: 135,
      countIn: 1,
      tempoRamp: 'off',
      capo: 0,
      swing: 'off',
    },
  ];

  const standalonePresets = [
    {
      slug: 'expressive-strumming-demo-v1',
      title: 'Expressive strumming',
      presetType: 'Feature demo',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Hear mid-bar chord changes, string ranges, palm mute, dead strum, and accents.',
      tags: ['c-family', 'expressive-strums', 'slash-chords'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 100
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| C G/B@8 | G/B | Am F@8 | F |

strum:
| D - D4 U! - U3P D2X U | x4`,
    },
    {
      slug: 'intermediate-c-g-am-f-v1',
      title: 'C, G, Am, and F changes',
      presetType: 'Exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice steady changes between C, G, Am, and the full F barre chord.',
      tags: ['c-family', 'chord-changes', 'quarter-notes'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 80
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| C | G | Am | F |

strum:
| D - D - D - D - | x4`,
    },
    {
      slug: 'beginner-g-c-d-em-v1',
      title: 'G, C, D, and Em changes',
      presetType: 'Exercise',
      teachingLevel: 'Beginner',
      teachingGoal: 'Practice four common open chords with an eighth-note strumming pattern.',
      tags: ['g-family', 'chord-changes', 'eighth-notes'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 88
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| G | C | D | Em |

strum:
| D - D U - U D U | x4`,
    },
    {
      slug: 'seventh-chord-turnaround-v1',
      title: 'Seventh-chord turnaround',
      presetType: 'Exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice changes between major seventh, minor seventh, and dominant seventh chords.',
      tags: ['seventh-chords', 'c-family', 'g-family'],
      rightsBasis: 'Original exercise',
      source: `4/4#8
bpm: 92
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| Cmaj7 | Am7 | D7 | G7 |

strum:
| D - D U - U D U | x4`,
    },
    {
      slug: 'get-lucky-palm-muted-strumming-v1',
      title: 'Get Lucky — palm-muted strumming',
      presetType: 'Song exercise',
      teachingLevel: 'Intermediate',
      teachingGoal: 'Practice a 16-slot groove with palm-muted partial strums and changing string ranges.',
      tags: ['song-exercise', 'palm-mute', 'sixteenth-notes', 'partial-strums'],
      rightsBasis: 'Short user transcription',
      rightsNotice: 'Unofficial user transcription for teaching. No lyrics, melody notation, audio, or artwork.',
      source: `4/4#16
bpm: 120
count-in: 1
tempo-ramp: off
capo: 0
swing: off

chords:
| Am | C | G | D7 |

strum:
| D U2P D2P U2P D - D3P - D - D4 U4 - U4 D4 - | x4`,
    },
  ];

  function freezeEntries(entries) {
    return Object.freeze(entries.map((entry) => Object.freeze({
      ...entry,
      ...(entry.tags ? { tags: Object.freeze([...entry.tags]) } : {}),
    })));
  }

  return Object.freeze({
    defaultPresetSlug: 'expressive-strumming-demo-v1',
    exerciseProfiles: freezeEntries(exerciseProfiles),
    sharedArrangements: freezeEntries(sharedArrangements),
    standalonePresets: freezeEntries(standalonePresets),
  });
}));
