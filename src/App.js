import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from "aws-amplify";
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";

import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    setTotalPrice(
      notes.reduce((acc, note) => acc + parseFloat(note.price), 0)
    );
  }, [notes]);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      price: form.get("price"),
      image: image.name,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>ShoppingList</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Food Name"
            label="Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Food Description"
            label="Description"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="price"
            placeholder="Food Price"
            label="Price"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
          <Button type="submit" variation="primary">
            Add Item
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Existing Food Items</Heading>
      <View margin="3rem 0">
        {notes.map((note) => (
          <Flex
            key={note.id || note.name}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            margin="1rem 0"
          >
            <Flex direction="row" alignItems="center">
              {note.image && (
                <Image
                  src={note.image}
                  alt={`Image of ${note.name}`}
                  objectFit="cover"
                  width="10rem"
                  height="10rem"
                  marginRight="1rem"
                  marginLeft="10rem"
                />
              )}
              <View>
                <Heading level={3}>{note.name}</Heading>
                <Text>{note.description}</Text>
                <Text fontWeight="bold">${note.price}</Text>
              </View>
            </Flex>
            <Button
              variation="danger"
              onClick={() => deleteNote({ id: note.id, name: note.name })}
              marginRight="20rem"
            >
              Delete
            </Button>
          </Flex>
        ))}
      </View>
      <Text>Total Price of Items: ${totalPrice.toFixed(2)}</Text>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </View>
);
};

export default withAuthenticator(App);    
