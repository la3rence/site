import { getCollection } from "./mongo";
import { ObjectId } from "mongodb";

const COLLECTION = "notes";

export const getNotesCollection = async () => getCollection(COLLECTION);

export const listNotes = async (includeHidden = false) => {
  const col = await getNotesCollection();
  const filter = includeHidden ? {} : { hidden: { $ne: true } };
  return col.find(filter).sort({ createdAt: -1 }).limit(50).toArray();
};

export const getNote = async id => {
  const col = await getNotesCollection();
  return col.findOne({ _id: new ObjectId(id) });
};

export const createNote = async (content, html, hidden = false) => {
  const col = await getNotesCollection();
  const now = new Date();
  const doc = { content, html, hidden, createdAt: now, updatedAt: now };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
};

export const deleteNote = async id => {
  const col = await getNotesCollection();
  return col.deleteOne({ _id: new ObjectId(id) });
};

export const updateNote = async (id, content, html, hidden) => {
  const col = await getNotesCollection();
  const update = { content, html, updatedAt: new Date() };
  if (hidden !== undefined) update.hidden = hidden;
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );
  return result;
};
