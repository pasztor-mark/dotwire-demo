import "server-only";
import { randomInt } from "node:crypto";

const ADJECTIVES = [
  "amber", "brave", "bright", "brisk", "calm", "clever", "cosmic", "cozy", "crisp", "curious",
  "dapper", "daring", "dusty", "eager", "early", "easy", "fancy", "fast", "fierce", "fluffy",
  "fond", "frosty", "gentle", "giddy", "glad", "golden", "grand", "happy", "hazy", "hearty",
  "humble", "icy", "jolly", "keen", "kind", "lively", "lucky", "lunar", "mellow", "merry",
  "mighty", "misty", "modest", "nimble", "noble", "odd", "olive", "polite", "proud", "quick",
  "quiet", "rapid", "rosy", "rustic", "sandy", "shiny", "silent", "silver", "sleepy", "slick",
  "smooth", "snowy", "solar", "spicy", "spry", "steady", "stellar", "sturdy", "sunny", "swift",
  "tidy", "tiny", "tough", "tranquil", "trusty", "upbeat", "vivid", "warm", "wavy", "whimsy",
  "wild", "windy", "wise", "witty", "zany", "zesty", "azure", "breezy", "candid", "cheery",
  "coral", "dreamy", "fuzzy", "jade", "plucky", "rugged", "sage", "teal", "velvet", "zippy",
];

const NOUNS = [
  "otter", "badger", "falcon", "fox", "heron", "koala", "lemur", "lynx", "marten", "moose",
  "narwhal", "newt", "ocelot", "orca", "owl", "panda", "panther", "parrot", "pelican", "penguin",
  "puffin", "quail", "rabbit", "raven", "robin", "salmon", "seal", "shark", "sloth", "sparrow",
  "squid", "stork", "swan", "tapir", "tiger", "toucan", "turtle", "walrus", "weasel", "whale",
  "wolf", "wombat", "yak", "zebra", "beaver", "bison", "camel", "cheetah", "cobra", "crane",
  "dingo", "dolphin", "eagle", "ferret", "finch", "gecko", "gibbon", "goose", "hare", "hedgehog",
  "ibis", "iguana", "jaguar", "kestrel", "kiwi", "llama", "magpie", "mole", "moth", "mustang",
  "octopus", "oriole", "osprey", "pony", "possum", "puma", "raccoon", "reindeer", "starling", "tern",
  "comet", "nebula", "pebble", "maple", "cedar", "willow", "acorn", "fern", "meadow", "river",
  "canyon", "glacier", "harbor", "island", "lagoon", "summit", "tundra", "valley", "breeze", "ember",
];

function pick<T>(list: readonly T[]): T {
  return list[randomInt(list.length)] as T;
}

const twoDigits = () => String(randomInt(10, 100));

/** `adjective-noun-NN`; after 50 collisions a second number group is appended. */
export function generateUsername(taken: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${pick(ADJECTIVES)}-${pick(NOUNS)}-${twoDigits()}`;
    if (!taken.has(name)) return name;
  }
  let name: string;
  do name = `${pick(ADJECTIVES)}-${pick(NOUNS)}-${twoDigits()}${twoDigits()}`;
  while (taken.has(name));
  return name;
}
