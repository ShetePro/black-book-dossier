import {NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, View} from "react-native";
import Feather from "@expo/vector-icons/Feather";

type SearchInputProps = {
  placeholder: string;
  className: string | undefined;
  onChange: (value: string) => void;
};
export default function SearchInput(props: SearchInputProps) {
  function handleChange (e:  NativeSyntheticEvent<TextInputChangeEventData>) {
    console.log(e.nativeEvent)
    props.onChange && props.onChange(e.nativeEvent.text)
  }
  return (
    <View style={styles.box} className={props.className}>
      <View style={styles.prefix}>
        <Feather name="search" size={24} color="#ccc" />
      </View>
      <TextInput
        style={styles.input}
        {...props}
        onChange={handleChange}
        placeholderTextColor={"#ccc"}
      ></TextInput>
    </View>
  );
}
const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  prefix: {
    position: "absolute",
    left: 10,
    margin: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ccc",
    borderRadius: 5,
    height: 40,
    paddingLeft: 40,
    paddingRight: 40,
  },
});
