import { inflateRawSync } from "node:zlib";
import { expect, it } from "vitest";
import { encodePlantUml } from "./plantuml-encoding";

function decode(encoded: string) {
	const standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	const plantUml = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
	const packed = Uint8Array.from(atob(Array.from(encoded, character => standard[plantUml.indexOf(character)]).join("")), character => character.charCodeAt(0));
	return inflateRawSync(packed).toString("utf8");
}

it("matches the PlantUML server's encoding for a short sequence", async () => {
	await expect(encodePlantUml("Bob -> Alice : hello")).resolves.toBe("SyfFKj2rKt3CoKnELR1Io4ZDoSa70000");
});

it.each([
	["Bob -> Alice : hello", "SyfFKj2rKt3CoKnELR1Io4ZDoSa70000"],
	["Alice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n",
		"Syp9J4vLqBLJSCfFib9mB2t9ICqhoKnEBCdCprC8IYqiJIqkuGBAAUW2rO0LOr5LN92VLvpA1G00"],
])("is compatible with PlantUML's published encoding for %j", async (source, expected) => {
	expect(decode(expected)).toBe(source);
	expect(decode(await encodePlantUml(source))).toBe(source);
});

it("preserves UTF-8 and compresses larger diagrams with raw deflate", async () => {
	const source = `@startuml\n${"Élodie -> ボブ: Hola 🪨\n".repeat(2000)}@enduml`;
	expect(decode(await encodePlantUml(source))).toBe(source);
});
